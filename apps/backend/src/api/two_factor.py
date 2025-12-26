"""Two-factor authentication API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_current_user_or_partial
from src.core.database import get_db
from src.core.logging import get_logger
from src.core.security import verify_password
from src.models.user import User
from src.services.two_factor_service import TwoFactorService

logger = get_logger(__name__)

router = APIRouter()


# Request/Response Models
class TwoFactorStatusResponse(BaseModel):
    """Response for 2FA status check."""

    enabled: bool
    backup_codes_remaining: int | None = None


class TwoFactorSetupResponse(BaseModel):
    """Response for 2FA setup initiation."""

    qr_code: str
    secret: str


class TwoFactorEnableRequest(BaseModel):
    """Request to enable 2FA."""

    code: str


class TwoFactorEnableResponse(BaseModel):
    """Response for enabling 2FA."""

    backup_codes: list[str]


class TwoFactorDisableRequest(BaseModel):
    """Request to disable 2FA."""

    password: str


class TwoFactorVerifyRequest(BaseModel):
    """Request to verify a 2FA code."""

    code: str


class TwoFactorVerifyResponse(BaseModel):
    """Response for 2FA verification."""

    valid: bool


class RegenerateBackupCodesRequest(BaseModel):
    """Request to regenerate backup codes."""

    password: str


class RegenerateBackupCodesResponse(BaseModel):
    """Response for backup code regeneration."""

    backup_codes: list[str]


@router.get("/two-factor/status", response_model=TwoFactorStatusResponse)
async def get_two_factor_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TwoFactorStatusResponse:
    """Get the current 2FA status for the authenticated user.

    Returns:
        TwoFactorStatusResponse with enabled status and remaining backup codes.
    """
    service = TwoFactorService(db)

    backup_codes_remaining = None
    if current_user.two_factor_enabled:
        backup_codes_remaining = await service.get_backup_codes_remaining(current_user.id)

    return TwoFactorStatusResponse(
        enabled=current_user.two_factor_enabled,
        backup_codes_remaining=backup_codes_remaining,
    )


@router.post("/two-factor/setup", response_model=TwoFactorSetupResponse)
async def setup_two_factor(
    current_user: User = Depends(get_current_user_or_partial),
    db: AsyncSession = Depends(get_db),
) -> TwoFactorSetupResponse:
    """Start the 2FA setup process.

    Generates a TOTP secret and QR code for the user to scan with their
    authenticator app.

    Can be called during login (with partial token) or from settings (with full token).

    Returns:
        TwoFactorSetupResponse with QR code and secret.

    Raises:
        HTTPException: If 2FA is already enabled.
    """
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled. Disable it first to set up again.",
        )

    service = TwoFactorService(db)
    secret, qr_code = await service.setup_2fa(current_user)

    logger.info("two_factor_setup_initiated", user_id=current_user.id)

    return TwoFactorSetupResponse(qr_code=qr_code, secret=secret)


@router.post("/two-factor/enable", response_model=TwoFactorEnableResponse)
async def enable_two_factor(
    request: TwoFactorEnableRequest,
    current_user: User = Depends(get_current_user_or_partial),
    db: AsyncSession = Depends(get_db),
) -> TwoFactorEnableResponse:
    """Enable 2FA after verifying the TOTP code.

    The user must first call /two-factor/setup and scan the QR code before
    calling this endpoint with the code from their authenticator app.

    Can be called during login (with partial token) or from settings (with full token).

    Args:
        request: Contains the 6-digit TOTP code.

    Returns:
        TwoFactorEnableResponse with backup codes.

    Raises:
        HTTPException: If the code is invalid or 2FA is not set up.
    """
    service = TwoFactorService(db)

    try:
        backup_codes = await service.enable_2fa(current_user, request.code)
        logger.info("two_factor_enabled", user_id=current_user.id)
        return TwoFactorEnableResponse(backup_codes=backup_codes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post("/two-factor/disable")
async def disable_two_factor(
    request: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Disable 2FA for the authenticated user.

    Requires the user's password for confirmation.

    Args:
        request: Contains the user's password.

    Returns:
        Success message.

    Raises:
        HTTPException: If 2FA is not enabled or password is incorrect.
    """
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled.",
        )

    # Verify password
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )

    service = TwoFactorService(db)
    await service.disable_2fa(current_user)

    logger.info("two_factor_disabled", user_id=current_user.id)

    return {"message": "2FA has been disabled."}


@router.post("/two-factor/verify", response_model=TwoFactorVerifyResponse)
async def verify_two_factor(
    request: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TwoFactorVerifyResponse:
    """Verify a 2FA code (TOTP or backup code).

    This endpoint can be used during login or for sensitive operations.

    Args:
        request: Contains the TOTP or backup code.

    Returns:
        TwoFactorVerifyResponse indicating if the code is valid.
    """
    service = TwoFactorService(db)
    valid = await service.verify_2fa(current_user, request.code)

    return TwoFactorVerifyResponse(valid=valid)


@router.post("/two-factor/regenerate-backup-codes", response_model=RegenerateBackupCodesResponse)
async def regenerate_backup_codes(
    request: RegenerateBackupCodesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RegenerateBackupCodesResponse:
    """Regenerate backup codes for the authenticated user.

    This invalidates all existing backup codes and generates new ones.
    Requires the user's password for confirmation.

    Args:
        request: Contains the user's password.

    Returns:
        RegenerateBackupCodesResponse with new backup codes.

    Raises:
        HTTPException: If 2FA is not enabled or password is incorrect.
    """
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled.",
        )

    # Verify password
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )

    service = TwoFactorService(db)
    backup_codes = await service.regenerate_backup_codes(current_user)

    logger.info("backup_codes_regenerated", user_id=current_user.id)

    return RegenerateBackupCodesResponse(backup_codes=backup_codes)
