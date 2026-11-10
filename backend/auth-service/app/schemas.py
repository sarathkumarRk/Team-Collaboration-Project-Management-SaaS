from pydantic import BaseModel, EmailStr

from app.models import UserRole


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role:str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role:str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OrganizationCreate(BaseModel):
    name: str
    description: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_by: int


class MemberCreate(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.TEAM_MEMBER


class MemberRoleUpdate(BaseModel):
    role: UserRole


class MemberResponse(BaseModel):
    id: int
    organization_id: int
    user_id: int
    role: UserRole