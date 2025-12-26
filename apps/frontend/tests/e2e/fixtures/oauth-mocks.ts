/**
 * OAuth mock response templates for E2E tests
 *
 * These templates provide deterministic OAuth provider responses
 * to avoid external dependencies in E2E tests.
 */

import { OAUTH_USER_GITHUB, OAUTH_USER_GOOGLE, OAUTH_USER_MICROSOFT } from './users';

export interface OAuthState {
  provider: 'google' | 'github' | 'microsoft' | 'apple';
  redirectUri: string;
  state: string;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface OAuthUserInfoResponse {
  id: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  verified_email?: boolean;
}

/**
 * Google OAuth mock responses
 */
export const GOOGLE_OAUTH = {
  authUrl: (state: string) =>
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=test-client&redirect_uri=http://localhost:5173/oauth/callback/google&response_type=code&scope=openid%20email%20profile&state=${state}`,

  callbackParams: {
    success: {
      code: 'google-auth-code-success',
      state: 'test-state-google',
    } as OAuthCallbackParams,
    error: {
      error: 'access_denied',
      error_description: 'User cancelled the authorization',
      state: 'test-state-google',
    },
  },

  tokenResponse: {
    success: {
      access_token: 'google-access-token-12345',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'google-refresh-token-67890',
      scope: 'openid email profile',
    } as OAuthTokenResponse,
    expired: {
      error: 'invalid_grant',
      error_description: 'Code expired',
    },
  },

  userInfo: {
    success: {
      id: 'google-user-id-123',
      email: OAUTH_USER_GOOGLE.email,
      name: OAUTH_USER_GOOGLE.displayName,
      given_name: OAUTH_USER_GOOGLE.firstName,
      family_name: OAUTH_USER_GOOGLE.lastName,
      picture: 'https://lh3.googleusercontent.com/test-avatar',
      verified_email: true,
    } as OAuthUserInfoResponse,
  },
};

/**
 * GitHub OAuth mock responses
 */
export const GITHUB_OAUTH = {
  authUrl: (state: string) =>
    `https://github.com/login/oauth/authorize?client_id=test-client&redirect_uri=http://localhost:5173/oauth/callback/github&scope=user:email&state=${state}`,

  callbackParams: {
    success: {
      code: 'github-auth-code-success',
      state: 'test-state-github',
    } as OAuthCallbackParams,
    error: {
      error: 'access_denied',
      error_description: 'The user has denied your application access.',
      state: 'test-state-github',
    },
  },

  tokenResponse: {
    success: {
      access_token: 'github-access-token-abcdef',
      token_type: 'bearer',
      scope: 'user:email',
    } as OAuthTokenResponse,
    expired: {
      error: 'bad_verification_code',
      error_description: 'The code passed is incorrect or expired.',
    },
  },

  userInfo: {
    success: {
      id: 'github-user-id-456',
      email: OAUTH_USER_GITHUB.email,
      name: OAUTH_USER_GITHUB.displayName,
      picture: 'https://avatars.githubusercontent.com/u/test-user',
    } as OAuthUserInfoResponse,
  },
};

/**
 * Microsoft OAuth mock responses
 */
export const MICROSOFT_OAUTH = {
  authUrl: (state: string) =>
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=test-client&redirect_uri=http://localhost:5173/oauth/callback/microsoft&response_type=code&scope=openid%20email%20profile&state=${state}`,

  callbackParams: {
    success: {
      code: 'microsoft-auth-code-success',
      state: 'test-state-microsoft',
    } as OAuthCallbackParams,
    error: {
      error: 'access_denied',
      error_description: 'The user did not consent to the app',
      state: 'test-state-microsoft',
    },
  },

  tokenResponse: {
    success: {
      access_token: 'microsoft-access-token-xyz123',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'microsoft-refresh-token-xyz456',
      scope: 'openid email profile',
    } as OAuthTokenResponse,
    expired: {
      error: 'invalid_grant',
      error_description: 'The provided authorization code is expired',
    },
  },

  userInfo: {
    success: {
      id: 'microsoft-user-id-789',
      email: OAUTH_USER_MICROSOFT.email,
      name: OAUTH_USER_MICROSOFT.displayName,
      given_name: OAUTH_USER_MICROSOFT.firstName,
      family_name: OAUTH_USER_MICROSOFT.lastName,
    } as OAuthUserInfoResponse,
  },
};

/**
 * Apple OAuth mock responses
 */
export const APPLE_OAUTH = {
  authUrl: (state: string) =>
    `https://appleid.apple.com/auth/authorize?client_id=test-client&redirect_uri=http://localhost:5173/oauth/callback/apple&response_type=code&scope=email%20name&state=${state}`,

  callbackParams: {
    success: {
      code: 'apple-auth-code-success',
      state: 'test-state-apple',
    } as OAuthCallbackParams,
    error: {
      error: 'user_cancelled_authorize',
      state: 'test-state-apple',
    },
  },

  tokenResponse: {
    success: {
      access_token: 'apple-access-token-abc789',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'apple-refresh-token-def012',
    } as OAuthTokenResponse,
    expired: {
      error: 'invalid_grant',
    },
  },

  userInfo: {
    success: {
      id: 'apple-user-id-012',
      email: 'oauth.apple@privaterelay.appleid.com',
      name: 'Apple User',
      given_name: 'Apple',
      family_name: 'User',
    } as OAuthUserInfoResponse,
  },
};

/**
 * Helper function to get OAuth mock by provider
 */
export function getOAuthMock(provider: 'google' | 'github' | 'microsoft' | 'apple') {
  switch (provider) {
    case 'google':
      return GOOGLE_OAUTH;
    case 'github':
      return GITHUB_OAUTH;
    case 'microsoft':
      return MICROSOFT_OAUTH;
    case 'apple':
      return APPLE_OAUTH;
  }
}
