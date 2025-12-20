# Contributing to CodeGraph

First off, thank you for considering contributing to CodeGraph! It's people like you that make CodeGraph a great tool for developers.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@codegraph.dev](mailto:conduct@codegraph.dev).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/yourusername/codegraph/issues) as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g., macOS 14.1, Ubuntu 22.04]
 - Docker version: [e.g., 24.0.7]
 - Browser: [e.g., Chrome 120, Firefox 121]
 - CodeGraph version: [e.g., 0.1.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most CodeGraph users
- **List any similar features** in other tools if applicable

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these `good-first-issue` and `help-wanted` issues:

- [Good first issues](https://github.com/yourusername/codegraph/labels/good%20first%20issue) - issues which should only require a few lines of code
- [Help wanted issues](https://github.com/yourusername/codegraph/labels/help%20wanted) - issues which should be a bit more involved

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Follow the coding standards** outlined in the `.clinerules` files
3. **Write tests** for any new functionality
4. **Update documentation** if you're changing APIs or adding features
5. **Ensure the test suite passes** (`npm test` and `poetry run pytest`)
6. **Format your code** (Black for Python, Prettier for TypeScript)
7. **Write a clear commit message** using conventional commits

## Development Process

### Setup Development Environment

1. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/codegraph.git
   cd codegraph
   ```

2. **Copy environment files:**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env
   # Edit .env files with your API keys
   ```

3. **Start development services:**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Backend setup:**
   ```bash
   cd apps/backend
   poetry install
   poetry run alembic upgrade head
   poetry run uvicorn src.main:app --reload
   ```

5. **Frontend setup:**
   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/your-bugfix-name
   ```

2. **Make your changes** following our coding standards

3. **Write/update tests:**
   ```bash
   # Backend tests
   cd apps/backend
   poetry run pytest
   
   # Frontend tests
   cd apps/frontend
   npm test
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat(scope): add amazing feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes (formatting, etc.)
   - `refactor`: Code refactoring
   - `test`: Adding or updating tests
   - `chore`: Maintenance tasks

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** from your fork to our `main` branch

## Coding Standards

### Backend (Python)

- **Style Guide**: PEP 8
- **Formatter**: Black (line length: 100)
- **Linter**: Ruff
- **Type Checker**: mypy
- **Docstrings**: Google style

```python
# Good example
async def get_task(
    db: AsyncSession,
    task_id: int,
    user_id: int
) -> Task:
    """Retrieve a task by ID.
    
    Args:
        db: Database session
        task_id: Task identifier
        user_id: User identifier for authorization
        
    Returns:
        Task instance
        
    Raises:
        TaskNotFoundError: If task doesn't exist or user lacks access
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise TaskNotFoundError(f"Task {task_id} not found")
    return task
```

Run checks:
```bash
poetry run black src tests
poetry run ruff check src tests
poetry run mypy src
```

### Frontend (TypeScript/React)

- **Style Guide**: Airbnb (adapted)
- **Formatter**: Prettier
- **Linter**: ESLint
- **Type Checker**: TypeScript strict mode

```typescript
// Good example
interface TaskCardProps {
  taskId: number;
  onUpdate?: (task: Task) => void;
}

export function TaskCard({ taskId, onUpdate }: TaskCardProps) {
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId),
  });

  if (isLoading) return <TaskCardSkeleton />;
  if (!task) return null;

  return (
    <div className="rounded-lg border p-4">
      {/* Component content */}
    </div>
  );
}
```

Run checks:
```bash
npm run lint
npm run type-check
npm run format
```

## Testing Guidelines

### Backend Tests

- **Unit tests**: Test individual functions/methods
- **Integration tests**: Test API endpoints
- **E2E tests**: Test complete workflows

```python
# Example unit test
@pytest.mark.asyncio
async def test_create_task(db_session: AsyncSession, test_user: User):
    """Test task creation."""
    task_data = TaskCreate(title="Test", description="Test task")
    task = await task_service.create_task(db_session, task_data, test_user.id)
    
    assert task.id is not None
    assert task.title == "Test"
```

### Frontend Tests

- **Component tests**: Test React components
- **Hook tests**: Test custom hooks
- **Integration tests**: Test user flows

```typescript
// Example component test
describe('TaskCard', () => {
  it('renders task information', async () => {
    render(<TaskCard taskId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Task Title')).toBeInTheDocument();
    });
  });
});
```

### Test Coverage

- Aim for **80%+ coverage** on new code
- All bug fixes must include a regression test
- Critical paths require integration tests

## Documentation

### Code Documentation

- All public APIs must have docstrings (Python) or JSDoc (TypeScript)
- Complex logic should have inline comments explaining "why", not "what"
- Update README.md when adding new features

### API Documentation

- FastAPI auto-generates OpenAPI docs at `/docs`
- Update OpenAPI descriptions for all endpoints
- Include example requests/responses

### Architecture Documentation

- Update `docs/architecture/` when making structural changes
- Include diagrams for complex workflows (use Mermaid)
- Document major design decisions

## Pull Request Process

1. **Update documentation** for any changed behavior
2. **Add/update tests** to maintain coverage
3. **Update CHANGELOG.md** (if applicable)
4. **Fill out the PR template** completely
5. **Request review** from maintainers
6. **Address review feedback** promptly
7. **Squash commits** before merging (we'll do this when merging)

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran to verify your changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged

## Screenshots (if applicable)
Add screenshots for UI changes

## Additional Notes
Any additional information
```

## Git Workflow

We use a simplified Git Flow:

- **`main`** - Production-ready code
- **`feature/*`** - New features
- **`bugfix/*`** - Bug fixes
- **`hotfix/*`** - Urgent production fixes
- **`docs/*`** - Documentation changes

### Branch Naming

- `feature/add-code-review-agent`
- `bugfix/fix-task-streaming`
- `hotfix/security-patch`
- `docs/update-setup-guide`

## Code Review Process

### For Contributors

- Be open to feedback and questions
- Respond to comments in a timely manner
- Push changes to the same branch (we'll see updates automatically)
- Mark conversations as resolved when addressed

### For Reviewers

- Be constructive and respectful
- Explain why changes are needed
- Approve when satisfied with changes
- Use GitHub's suggestion feature for small changes

## Community

### Getting Help

- 💬 [GitHub Discussions](https://github.com/yourusername/codegraph/discussions) - Ask questions and share ideas
- 🐛 [GitHub Issues](https://github.com/yourusername/codegraph/issues) - Report bugs and request features
- 📖 [Documentation](https://docs.codegraph.dev) - Read the docs

### Stay Updated

- ⭐ Star the repository to stay notified
- 👀 Watch the repository for updates
- 🐦 Follow [@codegraph](https://twitter.com/codegraph) (if applicable)

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project website (if applicable)

## License

By contributing to CodeGraph, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CodeGraph! 🎉

Questions? Open a [discussion](https://github.com/yourusername/codegraph/discussions) or reach out to the maintainers.