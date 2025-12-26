"""Authentication endpoints for cookie-based auth."""

from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_current_user_optional, get_current_user_partial
from src.core.config import settings
from src.core.cookies import clear_auth_cookies, set_auth_cookies, set_partial_auth_cookies
from src.core.csrf import generate_csrf_token
from src.core.database import get_db
from src.core.logging import get_logger
from src.core.security import (
    create_access_token,
    create_partial_access_token,
    create_refresh_token,
    create_session_token,
    decode_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from src.models.refresh_token import RefreshToken
from src.models.user import User
from src.models.user_session import UserSession
from src.schemas.user import UserCreate, UserLogin, UserResponse
from src.services.email.service import EmailSendingService, EmailTokenService
from src.services.two_factor_service import TwoFactorService

logger = get_logger(__name__)

router = APIRouter()


# Request/Response schemas
class VerifyEmailRequest(BaseModel):
    """Request to verify email with token."""

    token: str


class ForgotPasswordRequest(BaseModel):
    """Request to initiate password reset."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request to reset password with token."""

    token: str
    password: str


class ChangePasswordRequest(BaseModel):
    """Request to change password for authenticated user."""

    current_password: str
    new_password: str


class ChangeEmailRequest(BaseModel):
    """Request to change email for authenticated user."""

    new_email: EmailStr
    password: str


class TwoFactorLoginRequest(BaseModel):
    """Request to verify 2FA code during login."""

    code: str  # TOTP or backup code
    remember_me: bool = False


@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Register a new user account.

    Args:
        user_data: User registration data (email, password)
        db: Database session

    Returns:
        UserResponse: Created user data

    Raises:
        HTTPException: If email already exists
    """
    # Check if user with this email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user with hashed password
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False,
        email_verified=False,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate and send verification email
    email_service = EmailTokenService()
    email_sender = EmailSendingService()
    user_email = new_user.email  # Capture email before potential session rollback
    try:
        verification_token = await email_service.create_verification_token(
            db, new_user.id, user_email
        )
        await email_sender.send_verification_email(user_email, verification_token)
        new_user.email_verification_sent_at = datetime.now(datetime.now().astimezone().tzinfo)
        await db.commit()
        await db.refresh(new_user)
    except Exception as e:
        # Rollback the session to clear any pending transaction errors
        await db.rollback()
        logger.error(f"Failed to send verification email to {user_email}: {str(e)}")
        # Don't fail registration if email sending fails

    return new_user


class LoginResponse(BaseModel):
    """Response for successful login."""

    message: str
    user: UserResponse
    email_verified: bool
    requires_two_factor: bool = False
    two_factor_enabled: bool = False


@router.post("/auth/login", response_model=LoginResponse)
async def login(
    user_data: UserLogin,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    """
    Login with email and password, sets HTTP-only auth cookies.

    Args:
        user_data: Login credentials (email, password)
        request: FastAPI request object (for IP address)
        response: FastAPI response object (to set cookies)
        db: Database session

    Returns:
        LoginResponse: Success message with user data and email verification status

    Raises:
        HTTPException: If credentials are invalid or account is locked
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.now(user.locked_until.tzinfo):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account locked until {user.locked_until.isoformat()}",
        )

    # Verify password
    if not verify_password(user_data.password, user.hashed_password):
        # Increment failed login attempts
        user.failed_login_attempts += 1

        # Lock account after 5 failed attempts
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(datetime.now().astimezone().tzinfo) + timedelta(
                minutes=30
            )

        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Reset failed login attempts on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.now(datetime.now().astimezone().tzinfo)
    user.last_login_ip = request.client.host if request.client else None

    # Check if 2FA is enabled
    if user.two_factor_enabled:
        # User has 2FA - require verification
        partial_token = create_partial_access_token(data={"sub": str(user.id)})
        csrf_token = generate_csrf_token()

        await db.commit()  # Save user updates
        await db.refresh(user)  # Refresh to load all fields for response

        set_partial_auth_cookies(response, partial_token, csrf_token)

        logger.info(
            "user_login_2fa_verification_required",
            user_id=user.id,
        )

        return LoginResponse(
            message="2FA verification required",
            user=UserResponse.model_validate(user),
            email_verified=user.email_verified,
            requires_two_factor=True,
            two_factor_enabled=True,
        )

    # Check if 2FA is mandatory but not enabled
    if settings.two_factor_mandatory and not user.two_factor_enabled:
        # User must set up 2FA
        partial_token = create_partial_access_token(data={"sub": str(user.id)})
        csrf_token = generate_csrf_token()

        await db.commit()  # Save user updates
        await db.refresh(user)  # Refresh to load all fields for response

        set_partial_auth_cookies(response, partial_token, csrf_token)

        logger.info(
            "user_login_2fa_setup_required",
            user_id=user.id,
        )

        return LoginResponse(
            message="2FA setup required",
            user=UserResponse.model_validate(user),
            email_verified=user.email_verified,
            requires_two_factor=True,
            two_factor_enabled=False,
        )

    # 2FA not enabled and not mandatory - proceed with full login
    # Calculate token expiry based on remember_me flag
    if user_data.remember_me:
        # Extended session: 7 days
        refresh_expires_delta = timedelta(days=settings.refresh_token_expire_days)
        session_expires_delta = timedelta(days=settings.refresh_token_expire_days)
        logger.debug(f"Creating extended session for user {user.id} (remember_me=True)")
    else:
        # Default session: 4 hours
        refresh_expires_delta = timedelta(hours=settings.refresh_token_expire_hours)
        session_expires_delta = timedelta(hours=settings.refresh_token_expire_hours)
        logger.debug(f"Creating standard session for user {user.id} (remember_me=False)")

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token_str = create_refresh_token(
        data={"sub": str(user.id)},
        expires_delta=refresh_expires_delta,
    )
    csrf_token = generate_csrf_token()
    session_token = create_session_token()

    # Store refresh token in database with calculated expiry
    token_hash = hash_token(refresh_token_str)
    refresh_token_record = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(datetime.now().astimezone().tzinfo) + refresh_expires_delta,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent"),
    )
    db.add(refresh_token_record)

    # Create session record
    user_session = UserSession(
        user_id=user.id,
        session_token=session_token,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent"),
        last_activity=datetime.now(datetime.now().astimezone().tzinfo),
        expires_at=datetime.now(datetime.now().astimezone().tzinfo) + session_expires_delta,
    )
    db.add(user_session)

    await db.commit()
    await db.refresh(user)  # Refresh to load all fields for response

    # Set HTTP-only cookies
    set_auth_cookies(response, access_token, refresh_token_str, csrf_token)

    logger.info(
        "user_login_successful",
        user_id=user.id,
        email_verified=user.email_verified,
    )

    return LoginResponse(
        message="Login successful",
        user=UserResponse.model_validate(user),
        email_verified=user.email_verified,
        requires_two_factor=False,
        two_factor_enabled=False,
    )


@router.post("/auth/verify-2fa", response_model=LoginResponse)
async def verify_two_factor_login(
    request_data: TwoFactorLoginRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_partial)],
) -> LoginResponse:
    """
    Verify 2FA code during login and issue full tokens.

    Requires a partial access token (valid only during 2FA verification step).

    Args:
        request_data: Request containing 2FA code and remember_me flag
        request: FastAPI request object (for IP address)
        response: FastAPI response object (to set cookies)
        db: Database session
        current_user: Current user from partial token

    Returns:
        LoginResponse: Success message with user data and email verification status

    Raises:
        HTTPException: If 2FA code is invalid
    """
    # Verify 2FA code
    service = TwoFactorService(db)
    is_valid = await service.verify_2fa(current_user, request_data.code)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code",
        )

    # Update user last login info
    current_user.last_login_at = datetime.now(datetime.now().astimezone().tzinfo)
    current_user.last_login_ip = request.client.host if request.client else None

    # Calculate token expiry based on remember_me flag
    if request_data.remember_me:
        # Extended session: 7 days
        refresh_expires_delta = timedelta(days=settings.refresh_token_expire_days)
        session_expires_delta = timedelta(days=settings.refresh_token_expire_days)
        logger.debug(f"Creating extended session for user {current_user.id} (remember_me=True)")
    else:
        # Default session: 4 hours
        refresh_expires_delta = timedelta(hours=settings.refresh_token_expire_hours)
        session_expires_delta = timedelta(hours=settings.refresh_token_expire_hours)
        logger.debug(f"Creating standard session for user {current_user.id} (remember_me=False)")

    # Create full tokens
    access_token = create_access_token(data={"sub": str(current_user.id)})
    refresh_token_str = create_refresh_token(
        data={"sub": str(current_user.id)},
        expires_delta=refresh_expires_delta,
    )
    csrf_token = generate_csrf_token()
    session_token = create_session_token()

    # Store refresh token in database with calculated expiry
    token_hash = hash_token(refresh_token_str)
    refresh_token_record = RefreshToken(
        user_id=current_user.id,
        token_hash=token_hash,
        expires_at=datetime.now(datetime.now().astimezone().tzinfo) + refresh_expires_delta,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent"),
    )
    db.add(refresh_token_record)

    # Create session record
    user_session = UserSession(
        user_id=current_user.id,
        session_token=session_token,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent"),
        last_activity=datetime.now(datetime.now().astimezone().tzinfo),
        expires_at=datetime.now(datetime.now().astimezone().tzinfo) + session_expires_delta,
    )
    db.add(user_session)

    await db.commit()
    await db.refresh(current_user)

    # Set HTTP-only cookies for full authenticated session
    set_auth_cookies(response, access_token, refresh_token_str, csrf_token)

    logger.info(
        "user_login_2fa_verified",
        user_id=current_user.id,
        email_verified=current_user.email_verified,
    )

    return LoginResponse(
        message="Login successful",
        user=UserResponse.model_validate(current_user),
        email_verified=current_user.email_verified,
        requires_two_factor=False,
        two_factor_enabled=True,
    )


@router.post("/auth/logout")
async def logout(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie()] = None,
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None,
) -> dict[str, str]:
    """
    Logout user, clears cookies and revokes refresh token.

    Works even if access token is expired (uses optional authentication).

    Args:
        response: FastAPI response object (to clear cookies)
        refresh_token: Refresh token from cookie
        current_user: Current authenticated user (if any)
        db: Database session

    Returns:
        dict: Success message
    """
    # Revoke refresh token if present
    if refresh_token and current_user:
        token_hash = hash_token(refresh_token)
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.user_id == current_user.id,
            )
        )
        refresh_token_record = result.scalar_one_or_none()

        if refresh_token_record:
            refresh_token_record.revoked = True
            refresh_token_record.revoked_at = datetime.now(datetime.now().astimezone().tzinfo)
            await db.commit()
            logger.info(f"Revoked refresh token for user {current_user.id}")

    # Clear authentication cookies (always, even if user not authenticated)
    clear_auth_cookies(response)

    logger.info(
        "user_logout",
        user_id=current_user.id if current_user else None,
        had_refresh_token=refresh_token is not None,
    )

    return {"message": "Logout successful"}


@router.post("/auth/refresh")
async def refresh(
    response: Response,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> dict[str, str]:
    """
    Refresh access token using refresh token from cookie.

    Implements token rotation: issues new refresh token and revokes old one.

    Args:
        response: FastAPI response object (to set new cookies)
        request: FastAPI request object (for IP address)
        refresh_token: Refresh token from cookie
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException: If refresh token is invalid, expired, or revoked
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    # Decode refresh token
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Check if this is an OAuth token (doesn't have DB record)
    is_oauth_token = payload.get("oauth", False)
    if is_oauth_token:
        logger.info(
            "oauth_token_refresh_attempt",
            user_id=payload.get("sub"),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="oauth_reauthentication_required",
            headers={"X-Auth-Method": "oauth"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Check if refresh token exists and is not revoked (traditional auth only)
    token_hash = hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == int(user_id),
        )
    )
    refresh_token_record = result.scalar_one_or_none()

    if not refresh_token_record:
        logger.warning(
            "refresh_token_not_found",
            user_id=user_id,
            has_oauth_flag=is_oauth_token,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    if refresh_token_record.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    if refresh_token_record.expires_at < datetime.now(refresh_token_record.expires_at.tzinfo):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    # Get user
    user_result = await db.execute(select(User).where(User.id == int(user_id)))
    user = user_result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Detect if this was a remember_me session by checking original expiry
    original_expiry_hours = (
        refresh_token_record.expires_at - refresh_token_record.created_at
    ).total_seconds() / 3600
    is_remember_me_session = original_expiry_hours > 24  # > 1 day = extended session

    # Preserve session type
    if is_remember_me_session:
        new_refresh_expires_delta = timedelta(days=settings.refresh_token_expire_days)
        logger.debug(f"Rotating remember_me session for user {user.id}")
    else:
        new_refresh_expires_delta = timedelta(hours=settings.refresh_token_expire_hours)
        logger.debug(f"Rotating standard session for user {user.id}")

    # Revoke old refresh token (token rotation)
    refresh_token_record.revoked = True
    refresh_token_record.revoked_at = datetime.now(datetime.now().astimezone().tzinfo)

    # Create new tokens with preserved expiry
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
        expires_delta=new_refresh_expires_delta,
    )
    new_csrf_token = generate_csrf_token()

    # Store new refresh token with appropriate expiry
    new_token_hash = hash_token(new_refresh_token)
    new_refresh_token_record = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=datetime.now(datetime.now().astimezone().tzinfo) + new_refresh_expires_delta,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent"),
    )
    db.add(new_refresh_token_record)

    await db.commit()

    # Set new cookies
    set_auth_cookies(response, new_access_token, new_refresh_token, new_csrf_token)

    return {"message": "Token refreshed successfully"}


@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Get current authenticated user information.

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse: Current user data
    """
    return current_user


@router.post("/auth/verify-email")
async def verify_email(
    request_data: VerifyEmailRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    """
    Verify user email with verification token.

    Args:
        request_data: Email verification token
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException: If token is invalid or expired
    """
    logger.debug(f"Email verification request received (token length: {len(request_data.token)})")

    email_service = EmailTokenService()
    is_valid, user = await email_service.verify_email_token(db, request_data.token)

    if not is_valid or not user:
        logger.debug("Email verification failed: invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    logger.info(f"Email verified successfully for user_id={user.id}")

    # Send welcome email
    email_sender = EmailSendingService()
    try:
        await email_sender.send_welcome_email(user.email)
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")

    return {"message": "Email verified successfully"}


@router.post("/auth/resend-verification")
async def resend_verification(
    request_data: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    """
    Resend verification email to user.

    Args:
        request_data: User email address
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException: If email not found
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request_data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.email_verified:
        return {"message": "Email already verified"}

    # Generate and send new verification email
    email_service = EmailTokenService()
    email_sender = EmailSendingService()
    try:
        verification_token = await email_service.create_verification_token(db, user.id, user.email)
        await email_sender.send_verification_email(user.email, verification_token)
        user.email_verification_sent_at = datetime.now(datetime.now().astimezone().tzinfo)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to resend verification email to {user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email",
        ) from e

    return {"message": "Verification email sent"}


@router.post("/auth/forgot-password")
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    """
    Request password reset for user account.

    Args:
        request_data: User email address
        db: Database session

    Returns:
        dict: Success message (always returns success for security)
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request_data.email))
    user = result.scalar_one_or_none()

    # Always return success for security (don't reveal if email exists)
    if not user:
        return {"message": "If email exists, password reset link will be sent"}

    # Generate and send password reset email
    email_service = EmailTokenService()
    email_sender = EmailSendingService()
    try:
        reset_token = await email_service.create_password_reset_token(db, user.id)
        await email_sender.send_password_reset_email(user.email, reset_token)
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")

    return {"message": "If email exists, password reset link will be sent"}


@router.post("/auth/reset-password")
async def reset_password(
    request_data: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    """
    Reset user password with reset token.

    Args:
        request_data: Reset token and new password
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException: If token is invalid or expired
    """
    email_service = EmailTokenService()
    is_valid, user = await email_service.verify_password_reset_token(db, request_data.token)

    if not is_valid or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Update password
    user.hashed_password = get_password_hash(request_data.password)
    user.failed_login_attempts = 0
    user.locked_until = None
    await db.commit()

    return {"message": "Password reset successfully"}


@router.post("/auth/change-password")
async def change_password(
    request_data: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    """
    Change password for authenticated user.

    Args:
        request_data: Current password and new password
        current_user: Current authenticated user
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException: If current password is incorrect
    """
    # Verify current password
    if not verify_password(request_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    # Update password
    current_user.hashed_password = get_password_hash(request_data.new_password)
    await db.commit()

    return {"message": "Password changed successfully"}


@router.post("/auth/change-email")
async def change_email(
    request_data: ChangeEmailRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    """
    Request email change for authenticated user.

    Sends verification email to new address.

    Args:
        request_data: New email address and password
        current_user: Current authenticated user
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException: If password is incorrect or new email already registered
    """
    # Verify password
    if not verify_password(request_data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect",
        )

    # Check if new email already registered
    result = await db.execute(select(User).where(User.email == request_data.new_email))
    existing_user = result.scalar_one_or_none()

    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Generate and send email change confirmation
    email_service = EmailTokenService()
    email_sender = EmailSendingService()
    try:
        verification_token = await email_service.create_verification_token(
            db, current_user.id, request_data.new_email
        )
        await email_sender.send_email_change_confirmation(
            request_data.new_email, verification_token
        )
    except Exception as e:
        logger.error(f"Failed to send email change confirmation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send confirmation email",
        ) from e

    return {"message": "Verification email sent to new address"}
