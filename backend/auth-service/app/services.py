from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import OrganizationMember, UserRole


def get_organization_membership(
    db: Session,
    organization_id: int,
    user_id: int
):
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == organization_id,
        OrganizationMember.user_id == user_id
    ).first()

    return membership


def check_organization_access(
    db: Session,
    organization_id: int,
    user_id: int
):
    membership = get_organization_membership(
        db,
        organization_id,
        user_id
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization"
        )

    return membership


def check_organization_admin(
    db: Session,
    organization_id: int,
    user_id: int
):
    membership = check_organization_access(
        db,
        organization_id,
        user_id
    )

    if membership.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization admins can perform this action"
        )

    return membership