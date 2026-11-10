import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const statuses = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "COMPLETED",
];

function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [role, setRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const [formData, setFormData] = useState({
    project_id: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    due_date: "",
    assigned_to: "",
  });

  const isAdmin = role === "ADMIN";
  const isProjectManager = role === "PROJECT_MANAGER";
  const isTeamMember = role === "TEAM_MEMBER";

  const canCreateTask = isProjectManager;
  const canDeleteTask = isProjectManager;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        setRole(
          String(user.role || "")
            .split(".")
            .pop()
            .toUpperCase()
        );

        setCurrentUserId(
          user.id ? Number(user.id) : null
        );
      } catch {
        localStorage.removeItem("user");
      }
    }

    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const response = await api.get("/tasks/");

      setTasks(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects/");

      setProjects(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load projects"
      );
    }
  };

  const fetchProjectMembers = async (projectId) => {
    if (!projectId) {
      setProjectMembers([]);
      return;
    }

    try {
      setMembersLoading(true);

      const response = await api.get(
        `/projects/${projectId}/members`
      );

      const members = Array.isArray(response.data)
        ? response.data
        : response.data?.members || [];

      setProjectMembers(members);
    } catch (error) {
      setProjectMembers([]);

      toast.error(
        error.response?.data?.detail ||
          "Failed to load project members"
      );
    } finally {
      setMembersLoading(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "project_id") {
      setFormData((previous) => ({
        ...previous,
        project_id: value,
        assigned_to: "",
      }));

      setProjectMembers([]);
      await fetchProjectMembers(value);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!formData.project_id) {
      toast.error("Please select a project");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter task title");
      return;
    }

    if (!formData.due_date) {
      toast.error("Please select due date");
      return;
    }

    const taskData = {
      project_id: Number(formData.project_id),
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      due_date: formData.due_date,
      assigned_to: formData.assigned_to
        ? Number(formData.assigned_to)
        : null,
    };

    try {
      setSaving(true);

      const response = await api.post(
        "/tasks/",
        taskData
      );

      toast.success(
        response.data.message ||
          "Task created successfully"
      );

      setFormData({
        project_id: "",
        title: "",
        description: "",
        priority: "MEDIUM",
        due_date: "",
        assigned_to: "",
      });

      setProjectMembers([]);

      await fetchTasks();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to create task"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId) {
      return;
    }

    const taskId = Number(draggableId);
    const newStatus = destination.droppableId;

    const task = tasks.find(
      (item) => Number(item.id) === taskId
    );

    if (!task) return;

    if (
      isTeamMember &&
      Number(task.assigned_to) !== Number(currentUserId)
    ) {
      toast.error("You can update only your assigned tasks");
      return;
    }

    if (isAdmin) {
      toast.error("Admin cannot update task status");
      return;
    }

    if (task.status === "COMPLETED" && newStatus !== "COMPLETED") {
      toast.error(
        "Completed task cannot be reopened"
      );
      return;
    }

    const previousTasks = [...tasks];

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        Number(item.id) === taskId
          ? { ...item, status: newStatus }
          : item
      )
    );

    try {
      await api.put(`/tasks/${taskId}`, {
        status: newStatus,
      });

      toast.success("Task status updated successfully");

      await fetchTasks();
    } catch (error) {
      setTasks(previousTasks);

      toast.error(
        error.response?.data?.detail ||
          "Failed to update task status"
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!canDeleteTask) {
      toast.error("You do not have permission to delete tasks");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/tasks/${taskId}`);

      toast.success("Task deleted successfully");

      await fetchTasks();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to delete task"
      );
    }
  };

  const getMemberId = (member) => {
    return (
      member.user_id ??
      member.id ??
      member.member_id ??
      ""
    );
  };

  const getMemberName = (member) => {
    return (
      member.name ||
      member.user_name ||
      member.full_name ||
      member.email ||
      `User ${getMemberId(member)}`
    );
  };

  const getProjectName = (projectId) => {
    const project = projects.find(
      (item) => Number(item.id) === Number(projectId)
    );

    return project?.name || `Project ${projectId}`;
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesPriority =
      priorityFilter === "ALL" ||
      task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const getTasksByStatus = (status) => {
    return filteredTasks.filter(
      (task) => task.status === status
    );
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Task Board
            </h1>

            <p className="mt-2 text-gray-500">
              Manage tasks and track progress using Kanban board.
            </p>
          </div>

          <button
            onClick={() => {
              fetchTasks();
              fetchProjects();
            }}
            disabled={loading}
            className="rounded-md bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {canCreateTask && (
          <div className="mb-8 rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-gray-800">
              Create New Task
            </h2>

            <form
              onSubmit={handleCreateTask}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Select Project
                </label>

                <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                >
                  <option value="">Select Project</option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>

                {projects.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    No projects available.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Task Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter task title"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter task description"
                  rows="3"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Priority
                  </label>

                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Due Date
                  </label>

                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Assign Team Member
                  </label>

                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    disabled={
                      !formData.project_id || membersLoading
                    }
                    className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600 disabled:bg-gray-100"
                  >
                    <option value="">
                      {membersLoading
                        ? "Loading members..."
                        : "Select Team Member"}
                    </option>

                    {projectMembers.map((member) => {
                      const memberId = getMemberId(member);

                      return (
                        <option
                          key={memberId}
                          value={memberId}
                        >
                          {getMemberName(member)} (ID: {memberId})
                        </option>
                      );
                    })}
                  </select>

                  {formData.project_id &&
                    !membersLoading &&
                    projectMembers.length === 0 && (
                      <p className="mt-2 text-sm text-red-600">
                        No project members found.
                      </p>
                    )}
                </div>

              </div>

              <button
                type="submit"
                disabled={saving || projects.length === 0}
                className="rounded-md bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Task"}
              </button>
            </form>
          </div>
        )}

        {isTeamMember && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <p className="font-medium text-gray-700">
              Your assigned tasks
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Move your assigned tasks between columns to update their status.
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <p className="font-medium text-gray-700">
              Task Board - View Only
            </p>
            <p className="mt-1 text-sm text-gray-500">
              You can view tasks here. Task creation and status updates are not available for Admin.
            </p>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
          />

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600 sm:w-52"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-500">
            Loading tasks...
          </p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

              {statuses.map((status) => {
                const statusTasks = getTasksByStatus(status);

                return (
                  <div
                    key={status}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-bold text-red-600">
                        {status.replace("_", " ")}
                      </h2>

                      <span className="rounded-md border border-red-200 bg-white px-3 py-1 text-sm text-red-600">
                        {statusTasks.length}
                      </span>
                    </div>

                    <Droppable
                      droppableId={status}
                      isDropDisabled={isAdmin}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-40 space-y-3 rounded-md p-2 ${
                            snapshot.isDraggingOver
                              ? "bg-red-50"
                              : "bg-gray-50"
                          }`}
                        >
                          {statusTasks.map((task, index) => {
                            const isAssignedToCurrentUser =
                              Number(task.assigned_to) ===
                              Number(currentUserId);

                            const canDragTask =
                              isProjectManager ||
                              (isTeamMember &&
                                isAssignedToCurrentUser);

                            return (
                              <Draggable
                                key={task.id}
                                draggableId={String(task.id)}
                                index={index}
                                isDragDisabled={!canDragTask}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                    }}
                                    className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
                                      snapshot.isDragging
                                        ? "border-red-600"
                                        : ""
                                    }`}
                                  >
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                      <h3 className="font-semibold text-gray-800">
                                        {task.title}
                                      </h3>

                                      {canDeleteTask && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteTask(task.id)
                                          }
                                          onMouseDown={(e) =>
                                            e.stopPropagation()
                                          }
                                          className="text-sm text-red-600 hover:text-red-700"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>

                                    <p className="mb-3 text-sm text-gray-500">
                                      {task.description ||
                                        "No description"}
                                    </p>

                                    <div className="space-y-2 text-sm text-gray-600">
                                      <p>
                                        Project:{" "}
                                        <span className="font-medium">
                                          {getProjectName(
                                            task.project_id
                                          )}
                                        </span>
                                      </p>

                                      <p>
                                        Priority:{" "}
                                        <span className="font-medium text-red-600">
                                          {task.priority}
                                        </span>
                                      </p>

                                      <p>
                                        Assigned To:{" "}
                                        {task.assigned_to
                                          ? `User ${task.assigned_to}`
                                          : "Not assigned"}
                                      </p>

                                      <p>
                                        Due Date:{" "}
                                        {task.due_date
                                          ? String(task.due_date).slice(0, 10)
                                          : "-"}
                                      </p>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                      <Link
                                        to={`/tasks/${task.id}`}
                                        onClick={(e) =>
                                          e.stopPropagation()
                                        }
                                        className="text-sm font-medium text-red-600 hover:underline"
                                      >
                                        View Details
                                      </Link>

                                      {canDragTask && (
                                        <span className="text-xs text-gray-400">
                                          Drag to move
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}

                          {provided.placeholder}

                          {statusTasks.length === 0 && (
                            <p className="py-6 text-center text-sm text-gray-400">
                              No tasks
                            </p>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}

            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}

export default TaskBoard;