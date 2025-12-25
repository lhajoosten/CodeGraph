# OAuth Configuration Guide

This guide provides step-by-step instructions for configuring OAuth authentication with GitHub, Google, and Microsoft for CodeGraph.

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Google OAuth Setup](#google-oauth-setup)
- [Microsoft OAuth Setup](#microsoft-oauth-setup)
- [Environment Configuration](#environment-configuration)
- [Testing OAuth Flows](#testing-oauth-flows)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before configuring OAuth providers, ensure you have:

1. **Backend running** on `http://localhost:8000` (development)
2. **Frontend running** on `http://localhost:5173` (development)
3. **Database migrations applied**: `poetry run alembic upgrade head`
4. **Access to create OAuth applications** on each provider platform

---

## GitHub OAuth Setup

### Step 1: Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in the application details:

   **Application name**: `CodeGraph (Development)`

   **Homepage URL**: `http://localhost:5173`

   **Authorization callback URL**: `http://localhost:8000/api/v1/oauth/github/callback`

   **Application description** (optional): `CodeGraph AI coding platform`

4. Click **"Register application"**

### Step 2: Get Credentials

1. After registration, you'll see your **Client ID**
2. Click **"Generate a new client secret"** to create a client secret
3. **Copy both values immediately** - the secret won't be shown again

### Step 3: Add to .env

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
```

### Verification

Test the GitHub OAuth flow:
```bash
curl http://localhost:8000/api/v1/oauth/providers
# Should return: {"github": true, "google": false, "microsoft": false}
```

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Project name: `CodeGraph` (or any name you prefer)

### Step 2: Enable OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for testing with any Google account)
3. Click **"Create"**
4. Fill in required fields:

   **App name**: `CodeGraph`

   **User support email**: `your-email@example.com`

   **Developer contact email**: `your-email@example.com`

5. Click **"Save and Continue"**
6. **Scopes**: Click "Add or Remove Scopes", add:
   - `openid`
   - `email`
   - `profile`
7. Click **"Save and Continue"**
8. **Test users** (optional for development): Add your Google email
9. Click **"Save and Continue"**

### Step 3: Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `CodeGraph Web Client`
5. **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://localhost:8000`
6. **Authorized redirect URIs**:
   - `http://localhost:8000/api/v1/oauth/google/callback`
7. Click **"Create"**

### Step 4: Get Credentials

1. A popup will show your **Client ID** and **Client Secret**
2. Copy both values

### Step 5: Add to .env

```bash
# Google OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
```

### Verification

```bash
curl http://localhost:8000/api/v1/oauth/providers
# Should return: {"github": true, "google": true, "microsoft": false}
```

---

## Microsoft OAuth Setup

### Step 1: Register Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **"New registration"**
4. Fill in the details:

   **Name**: `CodeGraph`

   **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`

   **Redirect URI**:
   - Platform: **Web**
   - URI: `http://localhost:8000/api/v1/oauth/microsoft/callback`

5. Click **"Register"**

### Step 2: Get Application (Client) ID

1. After registration, you'll see the **Application (client) ID**
2. Copy this value - this is your `MICROSOFT_CLIENT_ID`

### Step 3: Create Client Secret

1. Go to **Certificates & secrets** → **Client secrets**
2. Click **"New client secret"**
3. Description: `CodeGraph Development`
4. Expires: Choose expiration (recommend **24 months** for development)
5. Click **"Add"**
6. **Copy the secret value immediately** - it won't be shown again

### Step 4: Configure API Permissions

1. Go to **API permissions**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Add these permissions:
   - `openid`
   - `email`
   - `profile`
   - `User.Read`
6. Click **"Add permissions"**
7. **(Optional)** Click **"Grant admin consent"** for your organization

### Step 5: Add to .env

```bash
# Microsoft OAuth
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
MICROSOFT_CLIENT_SECRET=abc~123_AbCdEfGhIjKlMnOpQrStUvWxYz
```

### Verification

```bash
curl http://localhost:8000/api/v1/oauth/providers
# Should return: {"github": true, "google": true, "microsoft": true}
```

---

## Environment Configuration

### Complete .env File Example

```bash
# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Security
SECRET_KEY=your-secret-key-here-change-in-production
CSRF_SECRET_KEY=your-csrf-secret-key-here-change-in-production

# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678

# Google OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx

# Microsoft OAuth
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
MICROSOFT_CLIENT_SECRET=abc~123_AbCdEfGhIjKlMnOpQrStUvWxYz
```

### Configuration Notes

1. **All three providers are optional** - configure only the ones you need
2. **Leave credentials empty to disable a provider**
3. **Never commit .env to version control** - it contains secrets
4. **Use different credentials for production** (see Production section)

---

## Testing OAuth Flows

### 1. Check Provider Status

```bash
curl http://localhost:8000/api/v1/oauth/providers
```

Expected response:
```json
{
  "github": true,
  "google": true,
  "microsoft": true
}
```

### 2. Test Authorization URL

```bash
# Test GitHub
curl http://localhost:8000/api/v1/oauth/github/authorize
# Should redirect to GitHub

# Test Google
curl http://localhost:8000/api/v1/oauth/google/authorize
# Should redirect to Google

# Test Microsoft
curl http://localhost:8000/api/v1/oauth/microsoft/authorize
# Should redirect to Microsoft
```

### 3. Test Full OAuth Flow

1. Start backend: `poetry run uvicorn src.main:app --reload`
2. Start frontend: `cd ../frontend && npm run dev`
3. Navigate to `http://localhost:5173/login`
4. Click on an OAuth provider button
5. Complete authentication on the provider's site
6. Verify you're redirected back and logged in

### 4. Verify Database Entry

After successful login:

```sql
SELECT * FROM oauth_accounts WHERE provider = 'github';
SELECT * FROM users WHERE email = 'your-email@example.com';
```

---

## Production Deployment

### Update OAuth Apps for Production

For each provider, you need to create **separate OAuth applications** for production:

#### GitHub Production Setup

1. Create new OAuth App with:
   - **Homepage URL**: `https://yourdomain.com`
   - **Callback URL**: `https://yourdomain.com/api/v1/oauth/github/callback`

#### Google Production Setup

1. Update OAuth consent screen to **Published** status
2. Create new OAuth Client ID with:
   - **Authorized JavaScript origins**: `https://yourdomain.com`
   - **Authorized redirect URIs**: `https://yourdomain.com/api/v1/oauth/google/callback`

#### Microsoft Production Setup

1. Create new App registration with:
   - **Redirect URI**: `https://yourdomain.com/api/v1/oauth/microsoft/callback`

### Production Environment Variables

```bash
# Production URLs
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Cookie Settings (IMPORTANT for production)
COOKIE_DOMAIN=yourdomain.com
COOKIE_SECURE=True
COOKIE_SAMESITE=strict

# OAuth with production credentials
GITHUB_CLIENT_ID=<production-client-id>
GITHUB_CLIENT_SECRET=<production-client-secret>
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-client-secret>
MICROSOFT_CLIENT_ID=<production-client-id>
MICROSOFT_CLIENT_SECRET=<production-client-secret>
```

### Security Checklist for Production

- [ ] Use separate OAuth apps for production
- [ ] Enable `COOKIE_SECURE=True` (requires HTTPS)
- [ ] Set `COOKIE_SAMESITE=strict` or `lax`
- [ ] Use strong `SECRET_KEY` and `CSRF_SECRET_KEY`
- [ ] Store OAuth tokens encrypted (see Security Improvements below)
- [ ] Use Redis for OAuth state storage instead of in-memory dict
- [ ] Enable rate limiting on OAuth endpoints
- [ ] Monitor OAuth login attempts
- [ ] Implement account linking verification (email confirmation)

---

## Troubleshooting

### "OAuth provider 'X' is not configured"

**Cause**: Missing or empty client ID/secret in .env

**Solution**:
1. Check `.env` file has both `CLIENT_ID` and `CLIENT_SECRET` for the provider
2. Restart the backend server after adding credentials
3. Verify with: `curl http://localhost:8000/api/v1/oauth/providers`

### "Invalid or expired OAuth state"

**Cause**: OAuth state expired (10 minutes) or server restarted

**Solution**:
1. OAuth states are stored in memory - they clear on server restart
2. Try the login flow again
3. For production, implement Redis-based state storage

### "redirect_uri_mismatch" Error

**Cause**: Callback URL in OAuth app doesn't match the one being used

**Solution**:
1. **GitHub**: Ensure callback is `http://localhost:8000/api/v1/oauth/github/callback`
2. **Google**: Check both authorized origins AND redirect URIs
3. **Microsoft**: Verify redirect URI in Azure portal exactly matches
4. **Important**: URL must match exactly (including http/https, port, path)

### "Failed to get access token"

**Cause**: Invalid client secret or code expired

**Solution**:
1. Verify client secret is correct (no extra spaces)
2. OAuth authorization codes expire quickly (usually 10 minutes)
3. Check backend logs for detailed error from provider
4. Try generating a new client secret

### OAuth login works but user not created

**Cause**: Database migration missing or email constraint violated

**Solution**:
1. Run migrations: `poetry run alembic upgrade head`
2. Check backend logs for database errors
3. Verify `oauth_accounts` table exists: `\dt` in psql

### Tokens not persisting across requests

**Cause**: Cookie settings incorrect or CORS misconfigured

**Solution**:
1. Verify `CORS_ALLOW_CREDENTIALS=True`
2. Check `COOKIE_DOMAIN` matches your domain
3. Frontend must use `credentials: 'include'` in fetch requests
4. Ensure frontend and backend URLs are in CORS_ORIGINS

---

## Security Improvements (TODO)

### High Priority

1. **Encrypt OAuth tokens in database**
   ```python
   # Use cryptography library to encrypt access_token and refresh_token
   from cryptography.fernet import Fernet
   ```

2. **Use Redis for OAuth state storage**
   ```python
   # Replace in-memory dict with Redis
   # Key: state, Value: state_data, TTL: 10 minutes
   await redis.setex(f"oauth:state:{state}", 600, json.dumps(state_data))
   ```

3. **Add rate limiting to OAuth endpoints**
   ```python
   # Prevent brute force attacks on OAuth callbacks
   # Use slowapi or custom Redis-based rate limiter
   ```

### Medium Priority

4. **Implement token refresh for long-lived sessions**
5. **Add OAuth account email verification before linking**
6. **Log all OAuth events for security auditing**
7. **Implement account recovery flow for OAuth-only users**

### Low Priority

8. **Support additional providers (Apple, Twitter, etc.)**
9. **Allow users to see OAuth login history**
10. **Implement OAuth scope management**

---

## Additional Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

## Support

If you encounter issues not covered in this guide:

1. Check the backend logs: `poetry run uvicorn src.main:app --reload --log-level debug`
2. Verify database state: `psql codegraph`
3. Test API endpoints: `curl -v http://localhost:8000/api/v1/oauth/providers`
4. Review OAuth provider documentation for error codes
5. Open an issue with detailed error logs and steps to reproduce
