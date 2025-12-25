# OAuth Quick Setup Checklist

Use this checklist for rapid OAuth configuration. For detailed instructions, see [OAUTH_SETUP.md](./OAUTH_SETUP.md).

## Prerequisites

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Database migrations applied: `poetry run alembic upgrade head`

---

## GitHub OAuth (5 minutes)

1. [ ] Go to https://github.com/settings/developers
2. [ ] Click "OAuth Apps" → "New OAuth App"
3. [ ] Fill in:
   - **Name**: `CodeGraph (Development)`
   - **Homepage URL**: `http://localhost:5173`
   - **Callback URL**: `http://localhost:8000/api/v1/oauth/github/callback`
4. [ ] Copy Client ID and Client Secret
5. [ ] Add to `.env`:
   ```bash
   GITHUB_CLIENT_ID=<your-client-id>
   GITHUB_CLIENT_SECRET=<your-client-secret>
   ```
6. [ ] Restart backend
7. [ ] Test: `curl http://localhost:8000/api/v1/oauth/providers` → `{"github": true}`

---

## Google OAuth (10 minutes)

1. [ ] Go to https://console.cloud.google.com/
2. [ ] Create new project or select existing
3. [ ] Enable OAuth consent screen:
   - [ ] Type: External
   - [ ] App name: `CodeGraph`
   - [ ] Scopes: `openid`, `email`, `profile`
4. [ ] Create credentials (OAuth client ID):
   - [ ] Application type: Web application
   - [ ] Name: `CodeGraph Web Client`
   - [ ] Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:8000`
   - [ ] Authorized redirect URIs: `http://localhost:8000/api/v1/oauth/google/callback`
5. [ ] Copy Client ID and Client Secret
6. [ ] Add to `.env`:
   ```bash
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   ```
7. [ ] Restart backend
8. [ ] Test: `curl http://localhost:8000/api/v1/oauth/providers` → `{"google": true}`

---

## Microsoft OAuth (10 minutes)

1. [ ] Go to https://portal.azure.com/
2. [ ] Navigate to Azure Active Directory → App registrations
3. [ ] Click "New registration":
   - [ ] Name: `CodeGraph`
   - [ ] Supported accounts: Any organizational directory and personal accounts
   - [ ] Redirect URI: Web → `http://localhost:8000/api/v1/oauth/microsoft/callback`
4. [ ] Copy Application (client) ID
5. [ ] Go to "Certificates & secrets" → "New client secret"
   - [ ] Description: `CodeGraph Development`
   - [ ] Expires: 24 months
   - [ ] Copy secret value immediately
6. [ ] Go to "API permissions" → Add permissions:
   - [ ] Microsoft Graph → Delegated
   - [ ] Add: `openid`, `email`, `profile`, `User.Read`
7. [ ] Add to `.env`:
   ```bash
   MICROSOFT_CLIENT_ID=<your-client-id>
   MICROSOFT_CLIENT_SECRET=<your-client-secret>
   ```
8. [ ] Restart backend
9. [ ] Test: `curl http://localhost:8000/api/v1/oauth/providers` → `{"microsoft": true}`

---

## Final Verification

1. [ ] All providers configured:
   ```bash
   curl http://localhost:8000/api/v1/oauth/providers
   # Expected: {"github": true, "google": true, "microsoft": true}
   ```

2. [ ] Test login flow:
   - [ ] Go to `http://localhost:5173/login`
   - [ ] Click GitHub button → Authenticate → Redirected back logged in
   - [ ] Click Google button → Authenticate → Redirected back logged in
   - [ ] Click Microsoft button → Authenticate → Redirected back logged in

3. [ ] Verify database:
   ```sql
   SELECT provider, email FROM oauth_accounts;
   SELECT email, email_verified FROM users;
   ```

---

## Complete .env Template

```bash
# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Security
SECRET_KEY=your-secret-key-here
CSRF_SECRET_KEY=your-csrf-secret-key-here

# Database
DATABASE_URL=postgresql+asyncpg://codegraph:codegraph@localhost:5432/codegraph

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOW_CREDENTIALS=True

# Cookie Settings
COOKIE_DOMAIN=localhost
COOKIE_SECURE=False
COOKIE_SAMESITE=lax

# OAuth - GitHub
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678

# OAuth - Google
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
MICROSOFT_CLIENT_SECRET=abc~123_AbCdEfGhIjKlMnOpQrStUvWxYz
```

---

## Common Issues

| Error | Solution |
|-------|----------|
| "OAuth provider not configured" | Add CLIENT_ID and CLIENT_SECRET to .env, restart backend |
| "redirect_uri_mismatch" | Verify callback URL is exactly `http://localhost:8000/api/v1/oauth/{provider}/callback` |
| "Invalid state" | Try login flow again (states expire after 10 minutes) |
| Provider button disabled in UI | Check `GET /api/v1/oauth/providers` returns `true` for that provider |

---

## Next Steps

- [ ] Read full documentation: [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- [ ] Configure production OAuth apps (separate credentials)
- [ ] Implement security improvements (token encryption, Redis state storage)
- [ ] Set up rate limiting on OAuth endpoints
- [ ] Enable audit logging for OAuth events
