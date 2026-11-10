from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Project, ProjectMember, ProjectRole


# Get Project
def get_project(
    project_id: int,
    db: Session,
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


# Check Organization Access
def check_organization_access(
    project: Project,
    current_user: dict,
    db: Session,
):
    if current_user["role"] == "ADMIN":
        return True

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project.id,
        ProjectMember.user_id == current_user["id"],
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project",
        )

    return True


# Check Project Access
def check_project_access(
    project: Project,
    current_user: dict,
    db: Session,
):
    if current_user["role"] == "ADMIN":
        return True

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project.id,
        ProjectMember.user_id == current_user["id"],
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project",
        )

    return True


# Check Project Manager Access
def check_project_manager(
    project: Project,
    current_user: dict,
    db: Session,
):
    if current_user["role"] == "ADMIN":
        return True

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project.id,
        ProjectMember.user_id == current_user["id"],
        ProjectMember.role == ProjectRole.PROJECT_MANAGER,
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project Manager access required",
        )

    return True


# Check Team Member Access
def check_team_member(
    project: Project,
    current_user: dict,
    db: Session,
):
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project.id,
        ProjectMember.user_id == current_user["id"],
        ProjectMember.role == ProjectRole.TEAM_MEMBER,
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Team Member access required",
        )

    return True