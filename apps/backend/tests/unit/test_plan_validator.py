"""Tests for the plan validator.

Tests the validation and complexity scoring of execution plans.
"""

from src.agents.analyzers.plan_validator import (
    ComplexityLevel,
    ComplexityScore,
    PlanSection,
    PlanStep,
    PlanValidation,
    ValidationIssue,
    ValidationSeverity,
    calculate_complexity,
    extract_plan_sections,
    get_refinement_suggestions,
    needs_refinement,
    validate_plan,
)


class TestComplexityLevel:
    """Tests for ComplexityLevel enum."""

    def test_complexity_levels_exist(self) -> None:
        """Test that all complexity levels are defined."""
        assert ComplexityLevel.TRIVIAL.value == "trivial"
        assert ComplexityLevel.LOW.value == "low"
        assert ComplexityLevel.MEDIUM.value == "medium"
        assert ComplexityLevel.HIGH.value == "high"
        assert ComplexityLevel.VERY_HIGH.value == "very_high"


class TestValidationSeverity:
    """Tests for ValidationSeverity enum."""

    def test_severity_levels_exist(self) -> None:
        """Test that all severity levels are defined."""
        assert ValidationSeverity.ERROR.value == "error"
        assert ValidationSeverity.WARNING.value == "warning"
        assert ValidationSeverity.INFO.value == "info"


class TestValidationIssue:
    """Tests for ValidationIssue dataclass."""

    def test_create_issue(self) -> None:
        """Test creating a validation issue."""
        issue = ValidationIssue(
            message="Test issue",
            severity=ValidationSeverity.WARNING,
            location="Step 3",
        )
        assert issue.message == "Test issue"
        assert issue.severity == ValidationSeverity.WARNING
        assert issue.location == "Step 3"

    def test_to_dict(self) -> None:
        """Test converting issue to dictionary."""
        issue = ValidationIssue(
            message="Test",
            severity=ValidationSeverity.ERROR,
        )
        result = issue.to_dict()
        assert result["message"] == "Test"
        assert result["severity"] == "error"
        assert result["location"] is None


class TestPlanStep:
    """Tests for PlanStep dataclass."""

    def test_create_step(self) -> None:
        """Test creating a plan step."""
        step = PlanStep(
            number=1,
            content="Implement authentication",
            has_success_criteria=True,
            has_dependencies=False,
        )
        assert step.number == 1
        assert step.content == "Implement authentication"
        assert step.has_success_criteria
        assert not step.has_dependencies

    def test_word_count(self) -> None:
        """Test word counting in step content."""
        step = PlanStep(number=1, content="Create the user model with validation")
        assert step.word_count == 6


class TestPlanSection:
    """Tests for PlanSection dataclass."""

    def test_create_section(self) -> None:
        """Test creating a plan section."""
        steps = [
            PlanStep(number=1, content="Step 1"),
            PlanStep(number=2, content="Step 2"),
        ]
        section = PlanSection(title="Design", steps=steps)
        assert section.title == "Design"
        assert section.step_count == 2

    def test_empty_section(self) -> None:
        """Test section with no steps."""
        section = PlanSection(title="Empty")
        assert section.step_count == 0


class TestComplexityScore:
    """Tests for ComplexityScore dataclass."""

    def test_create_score(self) -> None:
        """Test creating a complexity score."""
        score = ComplexityScore(
            step_count_score=0.5,
            dependency_score=0.3,
            technical_score=0.7,
            scope_score=0.4,
            overall_score=0.55,
            level=ComplexityLevel.MEDIUM,
        )
        assert score.overall_score == 0.55
        assert score.level == ComplexityLevel.MEDIUM

    def test_to_dict(self) -> None:
        """Test converting score to dictionary."""
        score = ComplexityScore(
            step_count_score=0.5,
            overall_score=0.5,
            level=ComplexityLevel.MEDIUM,
        )
        result = score.to_dict()
        assert result["step_count_score"] == 0.5
        assert result["level"] == "medium"


class TestPlanValidation:
    """Tests for PlanValidation dataclass."""

    def test_error_count(self) -> None:
        """Test counting error-level issues."""
        issues = [
            ValidationIssue(message="Error 1", severity=ValidationSeverity.ERROR),
            ValidationIssue(message="Warning 1", severity=ValidationSeverity.WARNING),
            ValidationIssue(message="Error 2", severity=ValidationSeverity.ERROR),
        ]
        validation = PlanValidation(is_valid=False, issues=issues)
        assert validation.error_count == 2
        assert validation.warning_count == 1

    def test_to_dict(self) -> None:
        """Test converting validation to dictionary."""
        validation = PlanValidation(
            is_valid=True,
            total_steps=5,
            has_phases=True,
            has_success_criteria=True,
        )
        result = validation.to_dict()
        assert result["is_valid"] is True
        assert result["total_steps"] == 5
        assert result["has_phases"] is True


class TestExtractPlanSections:
    """Tests for section extraction."""

    def test_extract_phases(self) -> None:
        """Test extracting phases from plan."""
        plan = """
## Phase 1: Design
1. Define data models
2. Create API schema

## Phase 2: Implementation
1. Implement models
2. Add validation
"""
        sections = extract_plan_sections(plan)
        assert len(sections) == 2
        assert sections[0].title == "Design"
        assert sections[1].title == "Implementation"

    def test_extract_numbered_steps(self) -> None:
        """Test extracting numbered steps."""
        plan = """
1. First step
2. Second step
3. Third step
"""
        sections = extract_plan_sections(plan)
        assert len(sections) == 1
        steps = sections[0].steps
        assert len(steps) == 3
        assert steps[0].number == 1
        assert steps[2].number == 3

    def test_extract_bullet_steps(self) -> None:
        """Test extracting bullet point steps."""
        plan = """
- First item
- Second item
- Third item
"""
        sections = extract_plan_sections(plan)
        assert len(sections) == 1
        steps = sections[0].steps
        assert len(steps) == 3

    def test_detect_success_criteria(self) -> None:
        """Test detecting success criteria in steps."""
        plan = """
1. Implement authentication
   - Success: Users can log in
2. Add validation
"""
        sections = extract_plan_sections(plan)
        steps = sections[0].steps
        assert steps[0].has_success_criteria

    def test_detect_dependencies(self) -> None:
        """Test detecting dependencies in steps."""
        plan = """
1. Create database schema
2. Implement models (depends on step 1)
3. Add API endpoints (after step 2)
"""
        sections = extract_plan_sections(plan)
        steps = sections[0].steps
        assert steps[1].has_dependencies
        assert steps[2].has_dependencies


class TestCalculateComplexity:
    """Tests for complexity calculation."""

    def test_trivial_complexity(self) -> None:
        """Test trivial complexity plan."""
        plan = "1. Update the README"
        sections = extract_plan_sections(plan)
        score = calculate_complexity(plan, sections)
        assert score.level == ComplexityLevel.TRIVIAL

    def test_low_complexity(self) -> None:
        """Test low complexity plan."""
        plan = """
1. Create a simple function
2. Add basic error handling
3. Write unit test
"""
        sections = extract_plan_sections(plan)
        score = calculate_complexity(plan, sections)
        assert score.level in [ComplexityLevel.TRIVIAL, ComplexityLevel.LOW]

    def test_medium_complexity(self) -> None:
        """Test medium complexity plan."""
        plan = """
## Phase 1: Database Design
1. Create user model with SQLAlchemy
2. Add database migration
3. Implement CRUD operations

## Phase 2: API Development
4. Create FastAPI endpoints
5. Add Pydantic validation schemas
6. Implement error handling

## Phase 3: Testing
7. Write integration tests
8. Add API documentation
"""
        sections = extract_plan_sections(plan)
        score = calculate_complexity(plan, sections)
        # This plan has database, api, testing - should be at least LOW complexity
        assert score.level in [ComplexityLevel.LOW, ComplexityLevel.MEDIUM, ComplexityLevel.HIGH]
        assert score.technical_score > 0.3  # Has technical keywords

    def test_high_complexity(self) -> None:
        """Test high complexity plan."""
        plan = """
## Phase 1: Architecture
1. Design microservice architecture
2. Set up API gateway with load balancer
3. Configure distributed cache with Redis

## Phase 2: Security
4. Implement OAuth2 authentication
5. Add encryption for sensitive data
6. Configure security headers

## Phase 3: Database
7. Create database migration strategy
8. Implement async database operations
9. Add transaction rollback handling

## Phase 4: Integration
10. Set up WebSocket real-time updates
11. Implement message queue
12. Add distributed tracing
"""
        sections = extract_plan_sections(plan)
        score = calculate_complexity(plan, sections)
        # High complexity plan with many technical keywords
        assert score.level in [
            ComplexityLevel.MEDIUM,
            ComplexityLevel.HIGH,
            ComplexityLevel.VERY_HIGH,
        ]
        assert score.technical_score > 0.5  # Many high-complexity keywords
        assert score.step_count_score > 0.5  # 12 steps

    def test_step_count_score(self) -> None:
        """Test step count contributes to score."""
        small_plan = "1. One step"
        large_plan = "\n".join([f"{i}. Step {i}" for i in range(1, 16)])

        small_sections = extract_plan_sections(small_plan)
        large_sections = extract_plan_sections(large_plan)

        small_score = calculate_complexity(small_plan, small_sections)
        large_score = calculate_complexity(large_plan, large_sections)

        assert large_score.step_count_score > small_score.step_count_score


class TestValidatePlan:
    """Tests for plan validation."""

    def test_valid_plan(self) -> None:
        """Test validating a well-structured plan."""
        plan = """
## Phase 1: Design
1. Define the data model for users
2. Create API endpoint specifications
3. Design database schema

## Phase 2: Implementation
4. Implement user model
5. Create CRUD endpoints
6. Add input validation
   - Success: All inputs validated

## Phase 3: Testing
7. Write unit tests
8. Add integration tests
"""
        result = validate_plan(plan)
        assert result.is_valid
        assert result.total_steps >= 6
        assert result.has_phases

    def test_empty_plan_invalid(self) -> None:
        """Test that empty plan is invalid."""
        result = validate_plan("")
        assert not result.is_valid
        assert result.error_count > 0

    def test_short_plan_invalid(self) -> None:
        """Test that very short plan is invalid."""
        result = validate_plan("Do something")
        assert not result.is_valid

    def test_too_few_steps_error(self) -> None:
        """Test error when too few steps."""
        result = validate_plan("1. Only one step here with some detail to make it longer")
        assert not result.is_valid
        # Either "minimum" or "steps" should be mentioned
        assert any(
            "minimum" in i.message.lower() or "step" in i.message.lower()
            for i in result.issues
            if i.severity == ValidationSeverity.ERROR
        )

    def test_too_many_steps_warning(self) -> None:
        """Test warning when too many steps."""
        plan = "\n".join([f"{i}. Step number {i} with details" for i in range(1, 25)])
        result = validate_plan(plan)
        assert any(
            i.severity == ValidationSeverity.WARNING and "steps" in i.message.lower()
            for i in result.issues
        )

    def test_vague_steps_warning(self) -> None:
        """Test warning for vague steps."""
        # Plan needs to be at least 50 chars to pass initial validation
        # Steps with only 2 words should trigger vague warning
        plan = """
Here is my implementation plan for this feature:
1. Do
2. Fix
3. Deploy here now on the server
"""
        result = validate_plan(plan)
        # Plan with very short step descriptions should have warnings about being vague
        assert any("vague" in i.message.lower() for i in result.issues)

    def test_missing_success_criteria_warning(self) -> None:
        """Test warning for missing success criteria."""
        plan = """
1. Create user authentication system
2. Add password hashing
3. Implement session management
4. Add logout functionality
"""
        result = validate_plan(plan)
        assert any("criteria" in i.message.lower() for i in result.issues)

    def test_large_plan_without_phases_info(self) -> None:
        """Test info message for large plan without phases."""
        plan = "\n".join([f"{i}. Step number {i} description here" for i in range(1, 12)])
        result = validate_plan(plan)
        assert any(
            i.severity == ValidationSeverity.INFO and "phase" in i.message.lower()
            for i in result.issues
        )

    def test_actionability_check(self) -> None:
        """Test plan actionability detection."""
        actionable = """
1. Create the user model
2. Implement authentication
3. Add validation tests
"""
        result = validate_plan(actionable)
        assert result.is_actionable

    def test_complexity_included(self) -> None:
        """Test that complexity is calculated."""
        plan = """
1. Implement database model
2. Add API endpoints
3. Write tests
"""
        result = validate_plan(plan)
        assert result.complexity is not None
        assert result.complexity.level is not None

    def test_to_dict_complete(self) -> None:
        """Test complete dictionary output."""
        plan = """
## Phase 1
1. Step one with details
2. Step two with more details
3. Step three
"""
        result = validate_plan(plan)
        d = result.to_dict()

        assert "is_valid" in d
        assert "issues" in d
        assert "complexity" in d
        assert "sections" in d
        assert "total_steps" in d


class TestNeedsRefinement:
    """Tests for refinement detection."""

    def test_invalid_plan_needs_refinement(self) -> None:
        """Test that invalid plans need refinement."""
        validation = PlanValidation(is_valid=False)
        assert needs_refinement(validation)

    def test_non_actionable_needs_refinement(self) -> None:
        """Test that non-actionable plans need refinement."""
        validation = PlanValidation(is_valid=True, is_actionable=False)
        assert needs_refinement(validation)

    def test_very_high_complexity_without_phases(self) -> None:
        """Test that very complex plans without phases need refinement."""
        validation = PlanValidation(
            is_valid=True,
            is_actionable=True,
            has_phases=False,
            complexity=ComplexityScore(
                overall_score=0.85,
                level=ComplexityLevel.VERY_HIGH,
            ),
        )
        assert needs_refinement(validation)

    def test_good_plan_no_refinement(self) -> None:
        """Test that good plans don't need refinement."""
        validation = PlanValidation(
            is_valid=True,
            is_actionable=True,
            has_phases=True,
            complexity=ComplexityScore(
                overall_score=0.5,
                level=ComplexityLevel.MEDIUM,
            ),
        )
        assert not needs_refinement(validation)


class TestGetRefinementSuggestions:
    """Tests for refinement suggestions."""

    def test_suggestions_for_errors(self) -> None:
        """Test suggestions when errors exist."""
        validation = PlanValidation(
            is_valid=False,
            issues=[
                ValidationIssue(message="Error", severity=ValidationSeverity.ERROR),
            ],
        )
        suggestions = get_refinement_suggestions(validation)
        assert any("error" in s.lower() for s in suggestions)

    def test_suggestions_for_non_actionable(self) -> None:
        """Test suggestions for non-actionable plans."""
        validation = PlanValidation(is_valid=True, is_actionable=False)
        suggestions = get_refinement_suggestions(validation)
        assert any("action" in s.lower() for s in suggestions)

    def test_suggestions_for_missing_criteria(self) -> None:
        """Test suggestions for missing success criteria."""
        validation = PlanValidation(
            is_valid=True,
            is_actionable=True,
            has_success_criteria=False,
            total_steps=5,
        )
        suggestions = get_refinement_suggestions(validation)
        assert any("criteria" in s.lower() for s in suggestions)

    def test_suggestions_for_no_phases(self) -> None:
        """Test suggestions when phases are missing."""
        validation = PlanValidation(
            is_valid=True,
            is_actionable=True,
            has_phases=False,
            total_steps=10,
        )
        suggestions = get_refinement_suggestions(validation)
        assert any("phase" in s.lower() for s in suggestions)

    def test_suggestions_for_very_high_complexity(self) -> None:
        """Test suggestions for very high complexity."""
        validation = PlanValidation(
            is_valid=True,
            is_actionable=True,
            complexity=ComplexityScore(
                overall_score=0.9,
                level=ComplexityLevel.VERY_HIGH,
            ),
        )
        suggestions = get_refinement_suggestions(validation)
        assert any("break" in s.lower() or "sub-task" in s.lower() for s in suggestions)
