import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";

function Projects() {
  const organizationId = localStorage.getItem("organization_id");

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    deadline: "",
  });

  const [memberData, setMemberData] = useState({
    user_id: "",
    role: "TEAM_MEMBER",
  });

  const [progress, setProgress] = useState(0);

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const role = String(
    user?.role || user?.user?.role || ""
  )
    .split(".")
    .pop()
    .toUpperCase();

  const isAdmin = role === "ADMIN";
  const isProjectManager = role === "PROJECT_MANAGER";
  const isTeamMember = role === "TEAM_MEMBER";

  const canCreateProject = isProjectManager;
  const canManageProject = isProjectManager;

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const response = await api.get("/projects/");

      setProjects(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to fetch projects"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!canCreateProject) {
      toast.error("Only Project Manager can create projects");
      return;
    }

    if (!organizationId) {
      toast.error("Please select an organization first");
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.start_date ||
      !formData.deadline
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.deadline < formData.start_date) {
      toast.error("Deadline cannot be before start date");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/projects/", {
        organization_id: Number(organizationId),
        name: formData.name.trim(),
        description: formData.description.trim(),
        start_date: formData.start_date,
        deadline: formData.deadline,
      });

      toast.success(
        response.data.message || "Project created successfully"
      );

      setFormData({
        name: "",
        description: "",
        start_date: "",
        deadline: "",
      });

      await fetchProjects();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to create project"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectProject = async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);

      setSelectedProject(response.data);
      setProgress(response.data.progress || 0);
      setEditMode(false);

      await fetchProjectMembers(projectId);
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to fetch project details"
      );
    }
  };

  const fetchProjectMembers = async (projectId) => {
    try {
      const response = await api.get(
        `/projects/${projectId}/members`
      );

      setMembers(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      setMembers([]);

      toast.error(
        error.response?.data?.detail || "Failed to fetch project members"
      );
    }
  };

  const handleEdit = () => {
    if (!canManageProject) {
      toast.error("Only Project Manager can edit projects");
      return;
    }

    setFormData({
      name: selectedProject.name || "",
      description: selectedProject.description || "",
      start_date: selectedProject.start_date
        ? selectedProject.start_date.slice(0, 10)
        : "",
      deadline: selectedProject.deadline
        ? selectedProject.deadline.slice(0, 10)
        : "",
    });

    setEditMode(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!canManageProject) {
      toast.error("Only Project Manager can update projects");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (
      formData.start_date &&
      formData.deadline &&
      formData.deadline < formData.start_date
    ) {
      toast.error("Deadline cannot be before start date");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        `/projects/${selectedProject.id}`,
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          start_date: formData.start_date || null,
          deadline: formData.deadline || null,
        }
      );

      toast.success(
        response.data.message || "Project updated successfully"
      );

      setEditMode(false);

      await fetchProjects();
      await handleSelectProject(selectedProject.id);
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to update project"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (projectId) => {
    if (!canManageProject) {
      toast.error("Only Project Manager can archive projects");
      return;
    }

    const confirmArchive = window.confirm(
      "Are you sure you want to archive this project?"
    );

    if (!confirmArchive) return;

    try {
      const response = await api.patch(
        `/projects/${projectId}/archive`
      );

      toast.success(
        response.data.message || "Project archived successfully"
      );

      setSelectedProject(null);
      setMembers([]);

      await fetchProjects();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to archive project"
      );
    }
  };

  const handleDelete = async (projectId) => {
    if (!canManageProject) {
      toast.error("Only Project Manager can delete projects");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/projects/${projectId}`);

      toast.success(
        response.data.message || "Project deleted successfully"
      );

      setSelectedProject(null);
      setMembers([]);

      await fetchProjects();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to delete project"
      );
    }
  };

  const handleMemberChange = (e) => {
    setMemberData({
      ...memberData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAssignMember = async (e) => {
    e.preventDefault();

    if (!canManageProject) {
      toast.error("Only Project Manager can assign members");
      return;
    }

    if (!memberData.user_id) {
      toast.error("Please enter user ID");
      return;
    }

    try {
      const response = await api.post(
        `/projects/${selectedProject.id}/members`,
        {
          user_id: Number(memberData.user_id),
          role: memberData.role,
        }
      );

      toast.success(
        response.data.message || "Member assigned successfully"
      );

      setMemberData({
        user_id: "",
        role: "TEAM_MEMBER",
      });

      await fetchProjectMembers(selectedProject.id);
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to assign member"
      );
    }
  };

  const handleProgressUpdate = async () => {
    if (!canManageProject) {
      toast.error("Only Project Manager can update progress");
      return;
    }

    try {
      const response = await api.patch(
        `/projects/${selectedProject.id}/progress`,
        {
          progress: Number(progress),
        }
      );

      toast.success(
        response.data.message || "Progress updated successfully"
      );

      await fetchProjects();
      await handleSelectProject(selectedProject.id);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to update project progress"
      );
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600">
            Project Management
          </h1>

          <p className="mt-2 text-gray-500">
            {isAdmin
              ? "View and monitor all your projects."
              : isProjectManager
              ? "Create, manage and track your projects."
              : "View your assigned projects."}
          </p>
        </div>

        {!organizationId && (
          <p className="mb-6 rounded-md border border-red-200 p-4 text-red-600">
            Please select an organization from Organization Dashboard first.
          </p>
        )}

        {canCreateProject && (
          <div className="mb-8 rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-gray-800">
              Create New Project
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Project Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
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
                  placeholder="Enter project description"
                  rows="3"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Deadline
                  </label>

                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !organizationId}
                className="rounded-md bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>
        )}

        <div className="mb-8 rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              All Projects
            </h2>

            <button
              onClick={fetchProjects}
              disabled={loading}
              className="rounded-md border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="py-6 text-center text-gray-500">
              Loading projects...
            </p>
          ) : projects.length === 0 ? (
            <p className="py-6 text-center text-gray-500">
              No projects found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="p-3">Project Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-gray-100"
                    >
                      <td className="p-3 font-medium text-gray-800">
                        {project.name}
                      </td>

                      <td className="p-3 text-gray-600">
                        {project.status}
                      </td>

                      <td className="p-3 text-gray-600">
                        {project.progress || 0}%
                      </td>

                      <td className="p-3 text-gray-600">
                        {project.deadline
                          ? project.deadline.slice(0, 10)
                          : "-"}
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              handleSelectProject(project.id)
                            }
                            className="rounded-md border border-red-600 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            View
                          </button>

                          {canManageProject && (
                            <>
                              <button
                                onClick={() =>
                                  handleArchive(project.id)
                                }
                                disabled={
                                  project.status === "ARCHIVED"
                                }
                                className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-40"
                              >
                                Archive
                              </button>

                              <button
                                onClick={() =>
                                  handleDelete(project.id)
                                }
                                className="rounded-md border border-red-600 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedProject && (
          <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-800">
                Project Details
              </h2>

              {canManageProject && !editMode && (
                <button
                  onClick={handleEdit}
                  disabled={selectedProject.status === "ARCHIVED"}
                  className="rounded-md bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:opacity-40"
                >
                  Edit Project
                </button>
              )}
            </div>

            {editMode && canManageProject ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Project name"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                />

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description"
                  rows="3"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                  />

                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-red-600 px-5 py-2 text-white hover:bg-red-700"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="rounded-md border border-gray-300 px-5 py-2 text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Name:</strong> {selectedProject.name}
                </p>

                <p>
                  <strong>Description:</strong>{" "}
                  {selectedProject.description || "No description"}
                </p>

                <p>
                  <strong>Status:</strong> {selectedProject.status}
                </p>

                <p>
                  <strong>Start Date:</strong>{" "}
                  {selectedProject.start_date?.slice(0, 10) || "-"}
                </p>

                <p>
                  <strong>Deadline:</strong>{" "}
                  {selectedProject.deadline?.slice(0, 10) || "-"}
                </p>
              </div>
            )}

            {canManageProject && (
              <>
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800">
                    Update Project Progress
                  </h3>

                  <div className="flex flex-wrap items-center gap-4">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) =>
                        setProgress(e.target.value)
                      }
                      disabled={
                        selectedProject.status === "ARCHIVED"
                      }
                      className="w-32 rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-red-600"
                    />

                    <span className="text-gray-600">%</span>

                    <button
                      onClick={handleProgressUpdate}
                      disabled={
                        selectedProject.status === "ARCHIVED"
                      }
                      className="rounded-md bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:opacity-40"
                    >
                      Update Progress
                    </button>
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800">
                    Assign Project Member
                  </h3>

                  <form
                    onSubmit={handleAssignMember}
                    className="grid grid-cols-1 gap-4 md:grid-cols-3"
                  >
                    <input
                      type="number"
                      name="user_id"
                      value={memberData.user_id}
                      onChange={handleMemberChange}
                      placeholder="Enter User ID"
                      required
                      className="rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                    />

                    <select
                      name="role"
                      value={memberData.role}
                      onChange={handleMemberChange}
                      className="rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                    >
                      <option value="PROJECT_MANAGER">
                        Project Manager
                      </option>

                      <option value="TEAM_MEMBER">
                        Team Member
                      </option>
                    </select>

                    <button
                      type="submit"
                      disabled={
                        selectedProject.status === "ARCHIVED"
                      }
                      className="rounded-md bg-red-600 px-5 py-3 text-white hover:bg-red-700 disabled:opacity-40"
                    >
                      Assign Member
                    </button>
                  </form>
                </div>
              </>
            )}

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Project Members
              </h3>

              {members.length === 0 ? (
                <p className="text-gray-500">
                  No members assigned.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-600">
                        <th className="p-3">User ID</th>
                        <th className="p-3">Role</th>
                      </tr>
                    </thead>

                    <tbody>
                      {members.map((member) => (
                        <tr
                          key={member.user_id}
                          className="border-b border-gray-100"
                        >
                          <td className="p-3 text-gray-800">
                            {member.user_id}
                          </td>

                          <td className="p-3 text-gray-600">
                            {member.role}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;