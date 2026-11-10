from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User,
    Organization,
    OrganizationMember,
    UserRole,
)
from app.schemas import (
    MemberCreate,
    MemberRoleUpdate,
    MemberResponse,
)
from app.dependencies import admin_required


router = APIRouter(
    prefix="/organizations/{organization_id}/members",
    tags=["Organization Members"],
)


def get_role_value(role):
    if hasattr(role, "value"):
        return role.value

    return str(role).split(".")[-1].upper()


def get_admin_membership(
    db: Session,
    organization_id: int,
    admin_id: int,
):
    return (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == admin_id,
            OrganizationMember.role == UserRole.ADMIN,
        )
        .first()
    )


def get_organization(
    db: Session,
    organization_id: int,
):
    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id)
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return organization


def validate_member_role(role):
    role_value = get_role_value(role)

    if role_value not in ["PROJECT_MANAGER", "TEAM_MEMBER"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PROJECT_MANAGER and TEAM_MEMBER roles can be assigned",
        )


# Add Member - Admin Only
@router.post("/", status_code=status.HTTP_201_CREATED)
def add_member(
    organization_id: int,
    data: MemberCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required),
):
    get_organization(db, organization_id)

    admin_membership = get_admin_membership(
        db,
        organization_id,
        admin.id,
    )

    if not admin_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an admin of this organization",
        )

    email = str(data.email).strip().lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first.",
        )

    validate_member_role(data.role)

    existing_member = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user.id,
        )
        .first()
    )

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member",
        )

    member = OrganizationMember(
        organization_id=organization_id,
        user_id=user.id,
        role=data.role,
    )

    try:
        db.add(member)
        db.commit()
        db.refresh(member)

        return {
            "message": "Member added successfully",
            "user_id": user.id,
            "email": user.email,
            "role": get_role_value(member.role),
        }

    except Exception as error:
        db.rollback()

        print("Add member error:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add member",
        )


# Get Organization Members - Admin Only
@router.get("/", response_model=list[MemberResponse])
def get_members(
    organization_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required),
):
    get_organization(db, organization_id)

    admin_membership = get_admin_membership(
        db,
        organization_id,
        admin.id,
    )

    if not admin_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an admin of this organization",
        )

    members = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id
        )
        .all()
    )

    return members


# Update Member Role - Admin Only
@router.put("/{user_id}")
def update_member_role(
    organization_id: int,
    user_id: int,
    data: MemberRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required),
):
    get_organization(db, organization_id)

    admin_membership = get_admin_membership(
        db,
        organization_id,
        admin.id,
    )

    if not admin_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an admin of this organization",
        )

    member = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    if get_role_value(member.role) == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin role cannot be changed",
        )

    validate_member_role(data.role)

    member.role = data.role

    try:
        db.commit()
        db.refresh(member)

        return {
            "message": "Member role updated successfully",
            "user_id": member.user_id,
            "role": get_role_value(member.role),
        }

    except Exception as error:
        db.rollback()

        print("Update member role error:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update member role",
        )


# Remove Member - Admin Only
@router.delete("/{user_id}")
def remove_member(
    organization_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required),
):
    get_organization(db, organization_id)

    admin_membership = get_admin_membership(
        db,
        organization_id,
        admin.id,
    )

    if not admin_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an admin of this organization",
        )

    member = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    if get_role_value(member.role) == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin member cannot be removed",
        )

    try:
        db.delete(member)
        db.commit()

        return {
            "message": "Member removed successfully",
        }

    except Exception as error:
        db.rollback()

        print("Remove member error:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove member",
        )