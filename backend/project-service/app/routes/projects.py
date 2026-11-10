
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project, ProjectMember, ProjectRole, ProjectStatus
from app.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectMemberCreate,
    ProjectMemberResponse,
    ProjectProgressUpdate,
)
from app.dependencies import get_current_user
from app.services import (
    get_project,
    check_project_access,
    check_project_manager,
)


router = APIRouter(prefix="/projects", tags=["Projects"])


def get_user_role(current_user):
    return str(current_user["role"]).split(".")[-1].upper()


def check_admin_or_project_access(project, current_user, db):
    role = get_user_role(current_user)

    if role == "ADMIN":
        return

    check_project_access(project, current_user, db)


def require_project_manager(current_user):
    if get_user_role(current_user) != "PROJECT_MANAGER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can perform this action",
        )


# Create Project
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_project_manager(current_user)

    if data.deadline < data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deadline cannot be before start date",
        )

    project = Project(
        organization_id=data.organization_id,
        name=data.name,
        description=data.description,
        start_date=data.start_date,
        deadline=data.deadline,
        created_by=current_user["id"],
    )

    db.add(project)
    db.flush()

    member = ProjectMember(
        project_id=project.id,
        user_id=current_user["id"],
        role=ProjectRole.PROJECT_MANAGER,
    )

    db.add(member)
    db.commit()
    db.refresh(project)

    return {
        "message": "Project created successfully",
        "project_id": project.id,
    }


# Get All Projects
@router.get("/", response_model=list[ProjectResponse])
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    role = get_user_role(current_user)

    query = db.query(Project)

    if role == "ADMIN":
        # Admin can view all projects
        return query.order_by(Project.id.desc()).all()

    if role in ["PROJECT_MANAGER", "TEAM_MEMBER"]:
        # Project Managers and Team Members can view
        # only projects where they are members
        return (
            query.join(
                ProjectMember,
                Project.id == ProjectMember.project_id,
            )
            .filter(
                ProjectMember.user_id == current_user["id"]
            )
            .distinct()
            .order_by(Project.id.desc())
            .all()
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not allowed to view projects",
    )


# Get Project By ID
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_by_id(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    project = get_project(project_id, db)

    check_admin_or_project_access(
        project,
        current_user,
        db,
    )

    return project


# Update Project
@router.put("/{project_id}")
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_project_manager(current_user)

    project = get_project(project_id, db)

    check_project_manager(project, current_user, db)

    if project.status == ProjectStatus.ARCHIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Archived project cannot be updated",
        )

    new_start_date = (
        data.start_date
        if data.start_date is not None
        else project.start_date
    )

    new_deadline = (
        data.deadline
        if data.deadline is not None
        else project.deadline
    )

    if new_deadline < new_start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deadline cannot be before start date",
        )

    if data.name is not None:
        project.name = data.name

    if data.description is not None:
        project.description = data.description

    if data.start_date is not None:
        project.start_date = data.start_date

    if data.deadline is not None:
        project.deadline = data.deadline

    if data.status is not None:
        if data.status == ProjectStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Use the archive endpoint to archive a project",
            )

        project.status = data.status

    db.commit()
    db.refresh(project)

    return {
        "message": "Project updated successfully",
    }


# Archive Project
@router.patch("/{project_id}/archive")
def archive_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_project_manager(current_user)

    project = get_project(project_id, db)

    check_project_manager(project, current_user, db)

    if project.status == ProjectStatus.ARCHIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project is already archived",
        )

    project.status = ProjectStatus.ARCHIVED

    db.commit()

    return {
        "message": "Project archived successfully",
    }


# Delete Project
@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_project_manager(current_user)

    project = get_project(project_id, db)

    check_project_manager(project, current_user, db)

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully",
    }


# Assign Project Manager or Team Member
@router.post(
    "/{project_id}/members",
    status_code=status.HTTP_201_CREATED,
)
def assign_member(
    project_id: int,
    data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_project_manager(current_user)

    project = get_project(project_id, db)

    check_project_manager(project, current_user, db)

    if project.status == ProjectStatus.ARCHIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign members to an archived project",
        )

    existing_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == data.user_id,
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already assigned to this project",
        )

    member = ProjectMember(
        project_id=project_id,
        user_id=data.user_id,
        role=data.role,
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "message": "Project member assigned successfully",
        "user_id": member.user_id,
        "role": member.role.value,
    }


# Get Project Members
@router.get(
    "/{project_id}/members",
    response_model=list[ProjectMemberResponse],
)
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    project = get_project(project_id, db)

    check_admin_or_project_access(
        project,
        current_user,
        db,
    )

    members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()

    return members


# Update Project Progress
@router.patch("/{project_id}/progress")
def update_project_progress(
    project_id: int,
    data: ProjectProgressUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_project_manager(current_user)

    project = get_project(project_id, db)

    check_project_manager(project, current_user, db)

    if project.status == ProjectStatus.ARCHIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Archived project progress cannot be updated",
        )

    project.progress = data.progress

    if project.progress == 100:
        project.status = ProjectStatus.COMPLETED
    elif project.status == ProjectStatus.COMPLETED:
        project.status = ProjectStatus.IN_PROGRESS

    db.commit()
    db.refresh(project)

    return {
        "message": "Project progress updated successfully",
        "progress": project.progress,
        "status": project.status.value,
    }
