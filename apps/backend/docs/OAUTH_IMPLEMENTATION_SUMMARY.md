# OAuth Implementation Summary

## Overview

This document summarizes the OAuth implementation for CodeGraph, including fixes applied and configuration instructions.

---

## Changes Applied

### 1. Fixed OAuth Redirect URIs (CRITICAL)

**Issue**: OAuth providers were redirecting to frontend URL instead of backend API.

**Files Changed**:
- `/home/lhajoosten/projects/CodeGraph/apps/backend/src/services/oauth_service.py`
- `/home/lhajoosten/projects/CodeGraph/apps/backend/src/core/config.py`

**Changes**:
- Added `backend_url` setting to configuration
- Updated all OAuth providers to use `{backend_url}/api/v1/oauth/{provider}/callback`
- Added `redirect_uri` parameter to GitHub token exchange (was missing)

**Before**:
```python
redirect_uri = f"{settings.frontend_url}/oauth/callback/github"  # ❌ WRONG
```

**After**:
```python
redirect_uri = f"{settings.backend_url}/api/v1/oauth/github/callback"  # ✅ CORRECT
```

### 2. Updated OAuth Callback Endpoint

**Issue**: Callback was POST with JSON body, but OAuth providers use GET with query params.

**File Changed**:
- `/home/lhajoosten/projects/CodeGraph/apps/backend/src/api/oauth.py`

**Changes**:
- Changed from `@router.post` to `@router.get`
- Changed from request body to query parameters (`code`, `state`)
- Updated to return `RedirectResponse` instead of JSON
- Now redirects to frontend after setting auth cookies
- Removed obsolete `OAuthCallbackRequest` model

**Flow**:
1. User clicks OAuth button → Backend redirects to provider
2. User authenticates → Provider redirects to `GET /api/v1/oauth/{provider}/callback?code=...&state=...`
3. Backend exchanges code for tokens → Creates/links user → Sets auth cookies
4. Backend redirects to frontend with success

### 3. Fixed Password Detection Logic

**Issue**: Logic for checking if user has real password was inverted.

**File Changed**:
- `/home/lhajoosten/projects/CodeGraph/apps/backend/src/services/oauth_service.py`

**Before**:
```python
has_password = not user.hashed_password.startswith("$2b$")  # ❌ INVERTED
```

**After**:
```python
has_real_password = user.hashed_password.startswith(("$2b$", "$2a$", "$2y$"))  # ✅ CORRECT
```

### 4. Updated Environment Configuration

**Files Changed**:
- `/home/lhajoosten/projects/CodeGraph/apps/backend/.env.example`
- `/home/lhajoosten/projects/CodeGraph/apps/backend/src/core/config.py`

**Changes**:
- Added `BACKEND_URL` setting
- Added OAuth provider credentials to `.env.example` with proper comments
- All OAuth credentials default to `None` (optional configuration)

---

## How OAuth Flow Works

### Authorization Flow

```
┌──────────┐                                  ┌─────────────┐
│          │  1. Click Login with GitHub      │   Frontend  │
│   User   │─────────────────────────────────>│             │
│          │                                  │ :5173       │
└──────────┘                                  └──────┬──────┘
     │                                               │
     │                                        2. GET /oauth/github/authorize
     │                                               │
     │                                        ┌──────▼──────┐
     │  3. Redirect to GitHub                │   Backend   │
     │<───────────────────────────────────────│   :8000     │
     │                                        └─────────────┘
     │
     │    ┌─────────────────┐
     │ 4. │ GitHub Login    │
     │───>│ Authorize App   │
     │<───│                 │
     │    └─────────────────┘
     │
     │  5. Redirect to backend callback
     │     http://localhost:8000/api/v1/oauth/github/callback?code=...&state=...
     │                                               │
     │                                        ┌──────▼──────┐
     │                                        │   Backend   │
     │                                        │             │
     │                                        │ - Exchange  │
     │                                        │   code for  │
     │                                        │   token     │
     │                                        │ - Get user  │
     │                                        │   profile   │
     │                                        │ - Create or │
     │                                        │   link user │
     │                                        │ - Set auth  │
     │                                        │   cookies   │
     │                                        └──────┬──────┘
     │                                               │
     │  6. Redirect to frontend with cookies         │
     │     http://localhost:5173/                    │
     │<──────────────────────────────────────────────┘
     │
     │    ┌─────────────────┐
     └───>│ Logged in!      │
          │ (with cookies)  │
          └─────────────────┘
```

### Key Points

1. **Backend handles OAuth callback**, not frontend
2. **Backend sets auth cookies** before redirecting to frontend
3. **Frontend receives user already authenticated** via cookies
4. **State parameter** provides CSRF protection
5. **Code exchange** happens server-side (client secret never exposed)

---

## Security Features

### ✅ Implemented

- **CSRF Protection**: State parameter with random tokens
- **State Expiration**: States expire after 10 minutes
- **Secure Cookie Settings**: HttpOnly, SameSite, Secure (production)
- **Email Verification**: OAuth emails automatically verified
- **Account Linking**: Prevents duplicate accounts with same email
- **Unlink Protection**: Prevents removing last authentication method
- **Proper Scopes**: Minimal permissions requested from providers

### ⚠️ TODO (See OAUTH_SETUP.md)

- **Token Encryption**: OAuth tokens stored in plain text (use Fernet encryption)
- **Redis State Storage**: Currently in-memory (doesn't work with multiple workers)
- **Rate Limiting**: No rate limits on OAuth endpoints
- **Token Refresh**: No automatic token refresh for expired access tokens
- **Audit Logging**: Limited OAuth event logging

---

## Configuration Quick Reference

### Required Environment Variables

```bash
# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Security
SECRET_KEY=<generate-with-openssl-rand-hex-32>
CSRF_SECRET_KEY=<generate-with-openssl-rand-hex-32>

# Cookie Settings
COOKIE_DOMAIN=localhost
COOKIE_SECURE=False  # True in production
COOKIE_SAMESITE=lax
```

### OAuth Provider Configuration (Optional)

Each provider requires two values:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=<from-github-oauth-app>
GITHUB_CLIENT_SECRET=<from-github-oauth-app>

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

# Microsoft OAuth
MICROSOFT_CLIENT_ID=<from-azure-portal>
MICROSOFT_CLIENT_SECRET=<from-azure-portal>
```

**Leave empty to disable a provider.**

---

## Callback URLs for OAuth Apps

When creating OAuth applications on each provider platform, use these **exact** callback URLs:

### Development (localhost)

- **GitHub**: `http://localhost:8000/api/v1/oauth/github/callback`
- **Google**: `http://localhost:8000/api/v1/oauth/google/callback`
- **Microsoft**: `http://localhost:8000/api/v1/oauth/microsoft/callback`

### Production

- **GitHub**: `https://yourdomain.com/api/v1/oauth/github/callback`
- **Google**: `https://yourdomain.com/api/v1/oauth/google/callback`
- **Microsoft**: `https://yourdomain.com/api/v1/oauth/microsoft/callback`

**Important**: The callback URL must be **exactly** as shown above. Any mismatch will cause `redirect_uri_mismatch` errors.

---

## API Endpoints

### Check Provider Configuration

```bash
GET /api/v1/oauth/providers
```

**Response**:
```json
{
  "github": true,
  "google": true,
  "microsoft": false
}
```

### Start OAuth Flow

```bash
GET /api/v1/oauth/{provider}/authorize
GET /api/v1/oauth/{provider}/authorize?redirect_url=/dashboard
```

**Effect**: Redirects to OAuth provider's login page.

### OAuth Callback (Called by Provider)

```bash
GET /api/v1/oauth/{provider}/callback?code=...&state=...
```

**Effect**: Exchanges code, creates/links user, sets cookies, redirects to frontend.

### Link OAuth Account (Authenticated)

```bash
GET /api/v1/oauth/{provider}/authorize/link
```

**Effect**: Links OAuth account to currently logged-in user.

### Get Linked Accounts (Authenticated)

```bash
GET /api/v1/oauth/accounts
```

**Response**:
```json
{
  "accounts": [
    {
      "provider": "github",
      "provider_user_id": "12345678",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://...",
      "connected_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Unlink OAuth Account (Authenticated)

```bash
DELETE /api/v1/oauth/{provider}/unlink
```

**Effect**: Removes OAuth account link (prevents removal if it's the only auth method).

---

## Database Schema

### oauth_accounts Table

```sql
CREATE TABLE oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url VARCHAR(512),
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id),
    CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider);
```

**Constraints**:
- One user can have multiple OAuth accounts (different providers)
- Each provider account can only link to one user
- Deleting user cascades to delete OAuth accounts

---

## Testing

### Manual Testing Steps

1. **Start services**:
   ```bash
   # Terminal 1: Backend
   cd apps/backend
   poetry run uvicorn src.main:app --reload

   # Terminal 2: Frontend
   cd apps/frontend
   npm run dev
   ```

2. **Check provider status**:
   ```bash
   curl http://localhost:8000/api/v1/oauth/providers
   ```

3. **Test OAuth flow**:
   - Navigate to `http://localhost:5173/login`
   - Click OAuth provider button
   - Complete authentication
   - Verify redirect back to app and logged in

4. **Verify database**:
   ```sql
   SELECT * FROM oauth_accounts;
   SELECT * FROM users WHERE email = 'your-email@example.com';
   ```

### Automated Testing

```bash
cd apps/backend
poetry run pytest tests/integration/test_oauth.py -v
```

---

## Production Deployment Checklist

- [ ] Create separate OAuth apps for production
- [ ] Update callback URLs to production domain
- [ ] Set `BACKEND_URL` to production API URL
- [ ] Set `FRONTEND_URL` to production frontend URL
- [ ] Set `COOKIE_SECURE=True`
- [ ] Set `COOKIE_SAMESITE=strict` or `lax`
- [ ] Use strong random values for `SECRET_KEY` and `CSRF_SECRET_KEY`
- [ ] Implement Redis-based OAuth state storage
- [ ] Implement token encryption in database
- [ ] Add rate limiting to OAuth endpoints
- [ ] Enable comprehensive audit logging
- [ ] Test all three OAuth flows in production
- [ ] Monitor OAuth login attempts and errors
- [ ] Set up alerts for OAuth failures

---

## Documentation Files

1. **OAUTH_SETUP.md** - Comprehensive setup guide (~500 lines)
   - Detailed step-by-step instructions for each provider
   - Screenshots and examples
   - Troubleshooting section
   - Security recommendations

2. **OAUTH_QUICKSTART.md** - Quick reference checklist
   - Checklist format for rapid setup
   - Essential information only
   - Common issues table

3. **OAUTH_IMPLEMENTATION_SUMMARY.md** - This file
   - Technical overview
   - Architecture and flow diagrams
   - API reference
   - Database schema

---

## Support

For issues or questions:

1. **Check documentation**: Start with OAUTH_QUICKSTART.md
2. **Review logs**: `poetry run uvicorn src.main:app --log-level debug`
3. **Test API**: Use curl to test each endpoint
4. **Check database**: Verify user and oauth_accounts entries
5. **Provider documentation**: Each provider has detailed OAuth docs

---

## Next Steps

1. **Configure providers**: Follow OAUTH_QUICKSTART.md
2. **Test flows**: Verify each provider works
3. **Implement security improvements**: See OAUTH_SETUP.md security section
4. **Prepare for production**: Create production OAuth apps
5. **Monitor and maintain**: Set up logging and alerts
