"""Tester agent node for generating and executing tests for generated code.

The tester is responsible for analyzing the generated code and plan, creating
comprehensive pytest test cases with full coverage, and simulating test execution.
It supports multiple test scenarios and integrates with the testing pipeline.

Features:
- Mock strategy recommendations for external dependencies
- Validation of mock usage in generated tests
- Enhanced test metadata with mock analysis
"""

import ast
import re
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from src.agents.analyzers.test_analyzer import create_test_analysis
from src.agents.infrastructure.models import get_tester_model
from src.agents.infrastructure.streaming import StreamingMetrics, stream_with_metrics
from src.agents.processing.parser import parse_code_blocks
from src.agents.state import WorkflowState
from src.core.logging import get_logger

logger = get_logger(__name__)


# =============================================================================
# Mock Strategy Detection and Recommendations
# =============================================================================


@dataclass
class ExternalDependency:
    """An external dependency detected in code.

    Attributes:
        name: Name of the dependency (e.g., "requests", "redis")
        import_statement: The import statement found
        usage_locations: Line numbers where it's used
        category: Category of dependency (http, database, filesystem, etc.)
    """

    name: str
    import_statement: str
    usage_locations: list[int] = field(default_factory=list)
    category: str = "unknown"


@dataclass
class MockRecommendation:
    """Recommendation for mocking a dependency.

    Attributes:
        dependency: The dependency to mock
        mock_pattern: Recommended mocking pattern
        example_code: Example code for the mock
        priority: Priority level (high, medium, low)
        reason: Reason for the recommendation
    """

    dependency: ExternalDependency
    mock_pattern: str
    example_code: str
    priority: str = "medium"
    reason: str = ""


@dataclass
class MockAnalysis:
    """Complete mock strategy analysis.

    Attributes:
        dependencies: List of detected external dependencies
        recommendations: Mock recommendations for each dependency
        mock_coverage: Percentage of dependencies with mocks in tests
        missing_mocks: Dependencies that should be mocked but aren't
        has_proper_mocking: Whether mocking is properly implemented
    """

    dependencies: list[ExternalDependency] = field(default_factory=list)
    recommendations: list[MockRecommendation] = field(default_factory=list)
    mock_coverage: float = 0.0
    missing_mocks: list[str] = field(default_factory=list)
    has_proper_mocking: bool = True

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "dependencies": [
                {
                    "name": d.name,
                    "category": d.category,
                    "usage_count": len(d.usage_locations),
                }
                for d in self.dependencies
            ],
            "recommendations": [
                {
                    "dependency": r.dependency.name,
                    "pattern": r.mock_pattern,
                    "priority": r.priority,
                    "reason": r.reason,
                }
                for r in self.recommendations
            ],
            "mock_coverage": round(self.mock_coverage, 1),
            "missing_mocks": self.missing_mocks,
            "has_proper_mocking": self.has_proper_mocking,
        }


# Patterns for detecting external dependencies
EXTERNAL_DEPENDENCY_PATTERNS = {
    "http": {
        "imports": ["requests", "httpx", "aiohttp", "urllib", "http.client"],
        "usage": ["get", "post", "put", "delete", "patch", "request", "fetch"],
    },
    "database": {
        "imports": ["sqlalchemy", "asyncpg", "psycopg2", "sqlite3", "pymongo", "redis"],
        "usage": ["execute", "query", "insert", "update", "delete", "find", "get", "set"],
    },
    "filesystem": {
        "imports": ["pathlib", "os.path", "shutil", "tempfile"],
        "usage": ["open", "read", "write", "mkdir", "remove", "exists", "glob"],
    },
    "external_api": {
        "imports": ["boto3", "google.cloud", "azure", "stripe", "twilio", "sendgrid"],
        "usage": ["client", "service", "send", "upload", "download"],
    },
    "time": {
        "imports": ["time", "datetime", "asyncio.sleep"],
        "usage": ["sleep", "now", "utcnow", "time.time"],
    },
    "random": {
        "imports": ["random", "secrets", "uuid"],
        "usage": ["random", "randint", "choice", "uuid4"],
    },
}

# Mock patterns by category
MOCK_PATTERNS = {
    "http": {
        "pattern": "unittest.mock.patch or responses/httpx_mock",
        "example": """
@pytest.fixture
def mock_http_client(mocker):
    mock = mocker.patch('requests.get')
    mock.return_value.status_code = 200
    mock.return_value.json.return_value = {"data": "test"}
    return mock
""",
    },
    "database": {
        "pattern": "unittest.mock.patch or test database fixture",
        "example": """
@pytest.fixture
async def mock_db_session(mocker):
    mock_session = mocker.AsyncMock()
    mock_session.execute.return_value.scalars.return_value.all.return_value = []
    return mock_session
""",
    },
    "filesystem": {
        "pattern": "tmp_path fixture or unittest.mock",
        "example": """
def test_file_operations(tmp_path):
    test_file = tmp_path / "test.txt"
    test_file.write_text("test content")
    # Your test here
""",
    },
    "external_api": {
        "pattern": "unittest.mock.patch with AsyncMock for async APIs",
        "example": """
@pytest.fixture
def mock_external_api(mocker):
    mock = mocker.patch('myapp.client.ExternalClient')
    mock.return_value.send.return_value = {"status": "success"}
    return mock
""",
    },
    "time": {
        "pattern": "freezegun or unittest.mock.patch",
        "example": """
from freezegun import freeze_time

@freeze_time("2024-01-15 12:00:00")
def test_time_sensitive():
    # datetime.now() will return the frozen time
    pass
""",
    },
    "random": {
        "pattern": "seed or unittest.mock.patch",
        "example": """
@pytest.fixture
def deterministic_random(mocker):
    mocker.patch('random.random', return_value=0.5)
    mocker.patch('uuid.uuid4', return_value='fixed-uuid')
""",
    },
}


def detect_external_dependencies(source_code: str) -> list[ExternalDependency]:
    """Detect external dependencies in source code.

    Analyzes imports and usage patterns to identify dependencies
    that should be mocked in tests.

    Args:
        source_code: The Python source code to analyze

    Returns:
        List of detected ExternalDependency objects
    """
    dependencies: list[ExternalDependency] = []

    # Try AST parsing for accurate analysis
    try:
        tree = ast.parse(source_code)
    except SyntaxError:
        # Fall back to regex for malformed code
        return _detect_dependencies_regex(source_code)

    # Track imports
    imports: dict[str, tuple[str, int]] = {}  # name -> (import_statement, line)

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                name = alias.asname or alias.name
                imports[name] = (f"import {alias.name}", node.lineno)
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            for alias in node.names:
                name = alias.asname or alias.name
                imports[name] = (f"from {module} import {alias.name}", node.lineno)

    # Categorize imports
    for name, (import_stmt, _line) in imports.items():
        category = _categorize_import(name, import_stmt)
        if category != "internal":
            dep = ExternalDependency(
                name=name,
                import_statement=import_stmt,
                category=category,
            )
            # Find usage locations
            dep.usage_locations = _find_usage_locations(tree, name)
            dependencies.append(dep)

    return dependencies


def _categorize_import(name: str, import_stmt: str) -> str:
    """Categorize an import into a dependency category."""
    import_lower = import_stmt.lower()
    name_lower = name.lower()

    for category, patterns in EXTERNAL_DEPENDENCY_PATTERNS.items():
        for imp in patterns["imports"]:
            if imp.lower() in import_lower or imp.lower() in name_lower:
                return category

    # Check for common external patterns
    if any(x in import_lower for x in ["client", "api", "service"]):
        return "external_api"

    return "internal"


def _find_usage_locations(tree: ast.AST, name: str) -> list[int]:
    """Find line numbers where a name is used."""
    locations = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and node.id == name:
            locations.append(node.lineno)
        elif isinstance(node, ast.Attribute):
            # Check for attribute access like "requests.get"
            if isinstance(node.value, ast.Name) and node.value.id == name:
                locations.append(node.lineno)
    return locations


def _detect_dependencies_regex(source_code: str) -> list[ExternalDependency]:
    """Fallback regex detection for dependencies."""
    dependencies = []

    # Find imports
    import_pattern = re.compile(r"^(?:from\s+([\w.]+)\s+)?import\s+([\w,\s]+)", re.MULTILINE)

    for match in import_pattern.finditer(source_code):
        module = match.group(1) or ""
        names = match.group(2).split(",")

        for name in names:
            name = name.strip().split(" as ")[0].strip()
            import_stmt = f"from {module} import {name}" if module else f"import {name}"
            category = _categorize_import(name, import_stmt)

            if category != "internal":
                dependencies.append(
                    ExternalDependency(
                        name=name,
                        import_statement=import_stmt,
                        category=category,
                    )
                )

    return dependencies


def generate_mock_recommendations(
    dependencies: list[ExternalDependency],
) -> list[MockRecommendation]:
    """Generate mock recommendations for detected dependencies.

    Args:
        dependencies: List of detected external dependencies

    Returns:
        List of MockRecommendation objects
    """
    recommendations = []

    for dep in dependencies:
        pattern_info = MOCK_PATTERNS.get(
            dep.category,
            {
                "pattern": "unittest.mock.patch",
                "example": f"mocker.patch('{dep.name}')",
            },
        )

        priority = "high" if dep.category in ["http", "database", "external_api"] else "medium"
        reason = _get_mock_reason(dep.category)

        recommendations.append(
            MockRecommendation(
                dependency=dep,
                mock_pattern=pattern_info["pattern"],
                example_code=pattern_info["example"],
                priority=priority,
                reason=reason,
            )
        )

    return recommendations


def _get_mock_reason(category: str) -> str:
    """Get the reason for mocking a category of dependency."""
    reasons = {
        "http": "HTTP calls should be mocked to avoid network dependencies and ensure deterministic tests",
        "database": "Database operations should be mocked or use test fixtures to avoid side effects",
        "filesystem": "File operations should use tmp_path or be mocked to ensure test isolation",
        "external_api": "External API calls must be mocked to prevent test flakiness and reduce costs",
        "time": "Time-dependent code should use freezegun or mocking for deterministic behavior",
        "random": "Random values should be seeded or mocked for reproducible tests",
    }
    return reasons.get(category, "External dependencies should be mocked for test isolation")


def validate_mock_usage(test_code: str, dependencies: list[ExternalDependency]) -> MockAnalysis:
    """Validate that tests properly mock detected dependencies.

    Analyzes test code to check if external dependencies are being mocked.

    Args:
        test_code: The generated test code
        dependencies: List of detected external dependencies

    Returns:
        MockAnalysis with coverage and missing mocks
    """
    test_lower = test_code.lower()

    # Check for mocking patterns
    mock_patterns = [
        "mock",
        "patch",
        "mocker",
        "monkeypatch",
        "asyncmock",
        "magicmock",
        "fixture",
        "tmp_path",
        "freeze_time",
        "responses",
    ]

    has_mocking = any(pattern in test_lower for pattern in mock_patterns)

    # Check which dependencies are mocked
    mocked_deps = []
    missing_mocks = []

    for dep in dependencies:
        dep_lower = dep.name.lower()
        # Check if dependency appears to be mocked
        is_mocked = (
            f"mock_{dep_lower}" in test_lower
            or f"patch('{dep.name}" in test_code
            or f'patch("{dep.name}' in test_code
            or "mocker.patch" in test_code
            and dep_lower in test_lower
        )

        if is_mocked:
            mocked_deps.append(dep.name)
        elif dep.category in ["http", "database", "external_api"]:
            # High-priority dependencies that should be mocked
            missing_mocks.append(dep.name)

    # Calculate coverage
    if dependencies:
        mock_coverage = (len(mocked_deps) / len(dependencies)) * 100
    else:
        mock_coverage = 100.0

    recommendations = generate_mock_recommendations(dependencies)

    return MockAnalysis(
        dependencies=dependencies,
        recommendations=recommendations,
        mock_coverage=mock_coverage,
        missing_mocks=missing_mocks,
        has_proper_mocking=has_mocking and len(missing_mocks) == 0,
    )


def analyze_mock_strategy(source_code: str, test_code: str) -> MockAnalysis:
    """Complete mock strategy analysis for source and test code.

    Main entry point for mock analysis. Detects dependencies in source code
    and validates their mocking in test code.

    Args:
        source_code: The source code being tested
        test_code: The generated test code

    Returns:
        Complete MockAnalysis
    """
    logger.debug("Analyzing mock strategy")

    # Detect dependencies in source
    dependencies = detect_external_dependencies(source_code)

    # Validate mocking in tests
    analysis = validate_mock_usage(test_code, dependencies)

    logger.info(
        "Mock analysis complete",
        dependency_count=len(dependencies),
        mock_coverage=analysis.mock_coverage,
        missing_mocks=len(analysis.missing_mocks),
    )

    return analysis


TESTER_SYSTEM_PROMPT = """You are an expert QA engineer specializing in pytest and comprehensive test coverage.

Your role is to analyze generated code and create thorough, production-ready test suites.

Requirements:
1. Analyze the code and identify all functions, classes, and edge cases
2. Write comprehensive pytest test cases with clear, descriptive names
3. Include unit tests for individual functions
4. Include integration tests for component interactions
5. Cover edge cases, boundary conditions, and error scenarios
6. Use fixtures and mocking for external dependencies
7. Include docstrings explaining what each test verifies
8. Follow pytest best practices and conventions
9. Ensure tests are deterministic and isolated
10. Add parametrized tests for multiple input scenarios

Output format: Provide complete, ready-to-run pytest test code.
Include all necessary imports and fixtures.
Structure tests in a clear, logical order.
Add comments for complex test logic but keep them concise.

When reviewing previous feedback, thoroughly address all concerns and improve test coverage."""


async def tester_node(
    state: WorkflowState,
    config: RunnableConfig = {},  # noqa: B006
) -> dict[str, Any]:
    """Test generation node - creates comprehensive tests for generated code.

    This node takes the generated code and execution plan, then produces
    comprehensive pytest test cases with full coverage including unit tests,
    integration tests, and edge case scenarios. It also analyzes the tests
    for coverage metrics and quality scoring.

    Args:
        state: Current workflow state containing code and plan
        config: Optional RunnableConfig with thread_id for tracing

    Returns:
        Dictionary with:
            - test_results: Generated pytest test code
            - test_analysis: Structured analysis with coverage, quality, recommendations
            - status: Updated to "reviewing"
            - messages: Accumulated LLM messages
            - metadata: Updated with test generation timestamp, analysis summary
            - iterations: Preserved from state

    Raises:
        Exception: If Claude API call fails
    """
    logger.info(
        "Tester node executing",
        task_id=state.get("task_id"),
        code_length=len(state.get("code", "")),
    )

    model = get_tester_model()

    # Build messages for the tester
    messages = list(state.get("messages", []))

    # Create the test generation prompt
    test_prompt = f"""Analyze the following code and execution plan, then generate comprehensive pytest test cases:

Code:
{state["code"]}

Execution Plan (for context):
{state["plan"]}

Generate complete, production-ready pytest test cases with:
- Unit tests for all functions and methods
- Integration tests for component interactions
- Edge case and boundary condition testing
- Error handling and exception testing
- Clear test names and docstrings
- Proper fixtures and mocking setup
- Parametrized tests for multiple scenarios
- At least 80% code coverage target"""

    messages.append(HumanMessage(content=test_prompt))

    # Invoke the model with system prompt
    import time

    start_time = time.time()
    response = await model.ainvoke(
        [
            ("system", TESTER_SYSTEM_PROMPT),
            *[(msg.type, msg.content) for msg in messages],
        ],
        config,
    )
    latency_ms = int((time.time() - start_time) * 1000)

    raw_content = response.content if isinstance(response, BaseMessage) else str(response)

    # Parse code blocks from response to extract test code
    parsed = parse_code_blocks(str(raw_content))

    # Get the primary test code (prefer parsed, fall back to raw)
    if parsed.has_code and parsed.test_blocks:
        test_content = "\n\n".join(block.content for block in parsed.test_blocks)
    elif parsed.has_code and parsed.code_blocks:
        test_content = parsed.code_blocks[0].content
    else:
        test_content = str(raw_content)

    # Analyze the generated tests
    source_code = state.get("code", "")
    test_analysis = create_test_analysis(
        test_code=test_content,
        source_code=source_code,
        filepath="tests/test_generated.py",
    )

    # Analyze mock strategy
    mock_analysis = analyze_mock_strategy(source_code, test_content)

    # Extract usage metadata from response
    usage_metadata = getattr(response, "usage_metadata", None) or {}
    input_tokens = usage_metadata.get("input_tokens", 0)
    output_tokens = usage_metadata.get("output_tokens", 0)
    total_tokens = usage_metadata.get("total_tokens", input_tokens + output_tokens)

    logger.info(
        "Tester generated tests",
        task_id=state.get("task_id"),
        test_length=len(test_content),
        test_count=test_analysis.test_suite.test_count,
        coverage=test_analysis.coverage.coverage_percentage,
        quality_score=test_analysis.quality_score,
        mock_coverage=mock_analysis.mock_coverage,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
    )

    return {
        "test_results": test_content,
        "test_analysis": {
            **test_analysis.to_dict(),
            "mock_strategy": mock_analysis.to_dict(),
        },
        "status": "reviewing",
        "messages": [response],
        "iterations": state.get("iterations", 0),
        "metadata": {
            **(state.get("metadata", {})),
            "tests_generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            "tester_model": "sonnet",
            "test_summary": {
                "test_count": test_analysis.test_suite.test_count,
                "coverage_percentage": test_analysis.coverage.coverage_percentage,
                "quality_score": test_analysis.quality_score,
                "passed": test_analysis.summary.passed,
                "failed": test_analysis.summary.failed,
                "recommendations": test_analysis.recommendations[:3],  # Top 3
            },
            "mock_summary": {
                "dependency_count": len(mock_analysis.dependencies),
                "mock_coverage": mock_analysis.mock_coverage,
                "missing_mocks": mock_analysis.missing_mocks,
                "has_proper_mocking": mock_analysis.has_proper_mocking,
            },
            "tester_usage": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "latency_ms": latency_ms,
            },
        },
    }


async def test_with_stream(
    code: str,
    plan: str,
    task_id: int,
    config: RunnableConfig | None = None,
) -> AsyncGenerator[tuple[str, StreamingMetrics | None], None]:
    """Generate tests with streaming output and metrics collection.

    This function streams the test generation process to the client in real-time
    while collecting usage metrics. Yields (chunk, None) for content chunks,
    then ("", metrics) as the final item with complete usage metrics.

    Args:
        code: Generated code to test
        plan: Execution plan from planner
        task_id: ID of the task
        config: Optional RunnableConfig for tracing

    Yields:
        Tuple of (content_chunk, None) for content, then ("", StreamingMetrics) at end

    Example:
        async for chunk, metrics in test_with_stream(code, plan, task_id):
            if metrics is None:
                send_to_client(chunk)  # Stream to client
            else:
                # Final metrics available
                log_usage(metrics.input_tokens, metrics.output_tokens)
    """
    logger.info("Starting stream test generation", task_id=task_id)

    model = get_tester_model()

    test_prompt = f"""Analyze the following code and execution plan, then generate comprehensive pytest test cases:

Code:
{code}

Execution Plan (for context):
{plan}

Generate complete, production-ready pytest test cases with:
- Unit tests for all functions and methods
- Integration tests for component interactions
- Edge case and boundary condition testing
- Error handling and exception testing
- Clear test names and docstrings
- Proper fixtures and mocking setup
- Parametrized tests for multiple scenarios
- At least 80% code coverage target"""

    messages: list[tuple[str, str]] = [
        ("system", TESTER_SYSTEM_PROMPT),
        ("human", test_prompt),
    ]

    async for chunk, metrics in stream_with_metrics(model, messages, config):
        if metrics is None:
            logger.debug("Streaming test chunk", task_id=task_id, chunk_length=len(chunk))
            yield chunk, None
        else:
            logger.info(
                "Finished stream test generation",
                task_id=task_id,
                input_tokens=metrics.input_tokens,
                output_tokens=metrics.output_tokens,
                latency_ms=metrics.latency_ms,
            )
            yield "", metrics
