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
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
)
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"]
)


def get_role_value(role):
    if hasattr(role, "value"):
        return role.value

    return str(role).split(".")[-1].upper()


def get_organization_membership(
    db: Session,
    organization_id: int,
    user_id: int,
):
    return (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
        .first()
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_role = get_role_value(current_user.role)

    if user_role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can create an organization",
        )

    organization = Organization(
        name=data.name,
        description=data.description,
        created_by=current_user.id,
    )

    try:
        db.add(organization)
        db.flush()

        member = OrganizationMember(
            organization_id=organization.id,
            user_id=current_user.id,
            role=UserRole.ADMIN,
        )

        db.add(member)

        db.commit()
        db.refresh(organization)

        return {
            "message": "Organization created successfully",
            "organization_id": organization.id,
        }

    except Exception as error:
        db.rollback()

        print("Organization creation error:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create organization",
        )


@router.get(
    "/",
    response_model=list[OrganizationResponse],
)
def get_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    organizations = (
        db.query(Organization)
        .join(
            OrganizationMember,
            Organization.id == OrganizationMember.organization_id,
        )
        .filter(
            OrganizationMember.user_id == current_user.id,
        )
        .all()
    )

    return organizations


@router.get(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
def get_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = get_organization_membership(
        db=db,
        organization_id=organization_id,
        user_id=current_user.id,
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization",
        )

    organization = (
        db.query(Organization)
        .filter(
            Organization.id == organization_id,
        )
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return organization


@router.put("/{organization_id}")
def update_organization(
    organization_id: int,
    data: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_role = get_role_value(current_user.role)

    if user_role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can update an organization",
        )

    membership = get_organization_membership(
        db=db,
        organization_id=organization_id,
        user_id=current_user.id,
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an admin of this organization",
        )

    member_role = get_role_value(membership.role)

    if member_role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization admin permission required",
        )

    organization = (
        db.query(Organization)
        .filter(
            Organization.id == organization_id,
        )
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    if data.name is not None:
        organization.name = data.name

    if data.description is not None:
        organization.description = data.description

    try:
        db.commit()
        db.refresh(organization)

        return {
            "message": "Organization updated successfully",
        }

    except Exception as error:
        db.rollback()

        print("Organization update error:", str(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update organization",
        )