from datetime import datetime, timedelta


def parse_date(value):
    if not value:
        return None

    try:
        return datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        ).replace(tzinfo=None)

    except (ValueError, TypeError):
        return None


def is_completed(task):
    return task.get("status") == "COMPLETED"


def is_overdue(task):
    due_date = parse_date(task.get("due_date"))

    if not due_date:
        return False

    return (
        due_date.date() < datetime.utcnow().date()
        and not is_completed(task)
    )


def get_dashboard_analytics(projects, tasks):
    total_tasks = len(tasks)

    completed_tasks = sum(
        1 for task in tasks
        if is_completed(task)
    )

    overdue_tasks = sum(
        1 for task in tasks
        if is_overdue(task)
    )

    pending_tasks = total_tasks - completed_tasks

    return {
        "total_projects": len(projects),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "overdue_tasks": overdue_tasks
    }


def get_project_analytics(projects, tasks):
    results = []

    for project in projects:
        project_tasks = [
            task for task in tasks
            if task.get("project_id") == project.get("id")
        ]

        total_tasks = len(project_tasks)

        completed_tasks = sum(
            1 for task in project_tasks
            if is_completed(task)
        )

        if total_tasks > 0:
            percentage = round(
                (completed_tasks / total_tasks) * 100,
                2
            )
        else:
            percentage = 0

        results.append({
            "project_id": project.get("id"),
            "project_name": project.get("name"),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_percentage": percentage
        })

    return results


def get_team_performance(tasks):
    members = {}

    for task in tasks:
        user_id = task.get("assigned_to")

        if user_id is None:
            continue

        if user_id not in members:
            members[user_id] = {
                "user_id": user_id,
                "total_tasks": 0,
                "completed_tasks": 0,
                "pending_tasks": 0
            }

        members[user_id]["total_tasks"] += 1

        if is_completed(task):
            members[user_id]["completed_tasks"] += 1
        else:
            members[user_id]["pending_tasks"] += 1

    return list(members.values())


def get_productivity_report(tasks, period):
    now = datetime.utcnow()

    if period == "weekly":
        start_date = now - timedelta(days=7)

    elif period == "monthly":
        start_date = now - timedelta(days=30)

    else:
        return None

    period_tasks = []

    for task in tasks:
        created_at = parse_date(task.get("created_at"))

        if created_at and start_date <= created_at <= now:
            period_tasks.append(task)

    total_tasks = len(period_tasks)

    completed_tasks = sum(
        1 for task in period_tasks
        if is_completed(task)
    )

    pending_tasks = total_tasks - completed_tasks

    return {
        "period": period,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks
    }