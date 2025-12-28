"""Mock Claude API responses for testing.

Contains realistic mock responses from Claude for different agent nodes
(planner, coder, tester, reviewer). These are used to test the workflow
without making actual API calls.

TODO: Generate responses from real Claude and store (Phase 3)
TODO: Add edge case responses (errors, edge cases, etc) (Phase 2)
"""

# Mock responses for planner node
MOCK_PLAN_RESPONSE = """## Execution Plan: User Authentication Endpoint

### Phase 1: Design & Schema
1. Create a User schema with email and password fields
2. Define authentication request/response models
3. Plan database schema for user storage

### Phase 2: Authentication Service
1. Implement password hashing using bcrypt
2. Create JWT token generation service
3. Add token validation logic

### Phase 3: FastAPI Endpoint
1. Create POST /auth/login endpoint
2. Implement credential validation
3. Return JWT token on success

### Phase 4: Testing
1. Write unit tests for password hashing
2. Write tests for token generation
3. Write integration tests for the endpoint
4. Test error cases (invalid credentials, etc)

### Phase 5: Security Review
1. Check for SQL injection vulnerabilities
2. Verify password storage is secure
3. Check token expiration handling
"""

# Mock code response for coder node
MOCK_CODE_RESPONSE = '''"""Authentication module for CodeGraph API."""

from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """User login response."""
    access_token: str
    token_type: str = "bearer"


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hash_: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode(), hash_.encode())


def create_access_token(user_id: int, expires_in_hours: int = 24) -> str:
    """Create a JWT access token."""
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours),
    }
    return jwt.encode(payload, "secret-key", algorithm="HS256")


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest) -> LoginResponse:
    """User login endpoint."""
    # This is simplified - in production, query the database
    # and verify credentials

    token = create_access_token(user_id=1)
    return LoginResponse(access_token=token)
'''

# Mock test response for tester node
MOCK_TEST_RESPONSE = """## Test Execution Results

### Unit Tests: ✅ 8/8 passed
- test_hash_password: ✅ PASSED
- test_verify_password: ✅ PASSED
- test_verify_password_wrong: ✅ PASSED
- test_create_access_token: ✅ PASSED
- test_token_includes_user_id: ✅ PASSED
- test_token_has_expiration: ✅ PASSED

### Integration Tests: ✅ 4/4 passed
- test_login_endpoint_success: ✅ PASSED (response time: 45ms)
- test_login_endpoint_invalid_credentials: ✅ PASSED
- test_token_validation: ✅ PASSED
- test_expired_token: ✅ PASSED

### Code Coverage: 92%
- auth.py: 95% coverage
- models.py: 85% coverage

### Summary
All tests passed successfully. Code coverage is above 90%.
No performance issues detected.
"""

# Mock review response for reviewer node
MOCK_REVIEW_RESPONSE = """## Code Review: User Authentication Endpoint

### ✅ Strengths
1. **Security**: Using bcrypt for password hashing is correct
2. **Design**: Clean separation of concerns
3. **Type Safety**: Proper use of Pydantic models
4. **Tests**: Comprehensive test coverage

### ⚠️  Areas for Improvement

1. **Token Storage** - Consider using environment variables for secret key
   - Current: hardcoded "secret-key"
   - Recommended: load from settings.SECRET_KEY

2. **Error Handling** - Add more specific error messages
   - Consider: different responses for missing user vs wrong password
   - Security: avoid revealing whether email exists

3. **Performance** - Consider caching
   - Token validation could be cached briefly
   - Password hashing is CPU-intensive

### 🔒 Security Review
- ✅ No SQL injection vulnerabilities
- ✅ Passwords properly hashed
- ✅ Token expiration implemented
- ⚠️  Consider HTTPS-only cookies
- ⚠️  Consider rate limiting on login endpoint

### 📝 Documentation
- Add docstrings to password functions
- Document token format
- Add authentication flow diagram

### Verdict: APPROVED WITH SUGGESTIONS
The code is production-ready with minor improvements recommended.
"""
