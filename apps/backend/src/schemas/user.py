"""Pydantic schemas for user-related operations."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str = Field(..., min_length=8, description="User password (minimum 8 characters)")
    first_name: str | None = Field(None, max_length=100, description="User's first name")
    last_name: str | None = Field(None, max_length=100, description="User's last name")


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str
    remember_me: bool = False


class UserUpdate(BaseModel):
    """Schema for updating user information."""

    email: EmailStr | None = None
    password: str | None = Field(None, min_length=8)


class UserResponse(UserBase):
    """Schema for user responses."""

    id: int
    is_active: bool
    is_superuser: bool
    email_verified: bool
    two_factor_enabled: bool
    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    profile_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdateRequest(BaseModel):
    """Schema for updating user profile information."""

    first_name: str | None = Field(None, max_length=100, description="User's first name")
    last_name: str | None = Field(None, max_length=100, description="User's last name")
    display_name: str | None = Field(None, max_length=200, description="User's display name")
    avatar_url: str | None = Field(
        None, max_length=512, description="URL to user's profile picture"
    )


class TokenResponse(BaseModel):
    """Schema for authentication token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for decoded token data."""

    user_id: int | None = None
