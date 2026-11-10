import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";

function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const response = await api.get("/projects/");

      setProjects(
        Array.isArray(response.data)
          ? response.data
          : response.data.projects || []
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const totalProjects = projects.length;

  const activeProjects = projects.filter(
    (project) =>
      project.status?.toUpperCase() === "ACTIVE"
  ).length;

  const completedProjects = projects.filter(
    (project) =>
      project.status?.toUpperCase() === "COMPLETED"
  ).length;

  const archivedProjects = projects.filter(
    (project) =>
      project.status?.toUpperCase() === "ARCHIVED"
  ).length;

  const averageProgress =
    totalProjects > 0
      ? Math.round(
          projects.reduce(
            (total, project) =>
              total + Number(project.progress || 0),
            0
          ) / totalProjects
        )
      : 0;

  const filteredProjects = projects.filter((project) =>
    project.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Project Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Monitor your projects and track their progress.
            </p>
          </div>

          <button
            onClick={fetchProjects}
            disabled={loading}
            className="rounded-md bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-500">
            Loading project dashboard...
          </p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Projects
                </p>

                <h2 className="mt-3 text-3xl font-bold text-red-600">
                  {totalProjects}
                </h2>
              </div>

              <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Active Projects
                </p>

                <h2 className="mt-3 text-3xl font-bold text-red-600">
                  {activeProjects}
                </h2>
              </div>

              <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Completed Projects
                </p>

                <h2 className="mt-3 text-3xl font-bold text-red-600">
                  {completedProjects}
                </h2>
              </div>

              <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Archived Projects
                </p>

                <h2 className="mt-3 text-3xl font-bold text-red-600">
                  {archivedProjects}
                </h2>
              </div>

            </div>

            <div className="mb-8 rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                Overall Project Progress
              </h2>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Average Progress
                </span>

                <span className="font-bold text-red-600">
                  {averageProgress}%
                </span>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-red-600 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, averageProgress)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  All Projects
                </h2>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-red-600 sm:w-64"
                />
              </div>

              {filteredProjects.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
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
                        <th className="p-3">Start Date</th>
                        <th className="p-3">End Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProjects.map((project) => (
                        <tr
                          key={project.id}
                          className="border-b border-gray-100"
                        >
                          <td className="p-3">
                            <p className="font-medium text-gray-800">
                              {project.name}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {project.description || "No description"}
                            </p>
                          </td>

                          <td className="p-3">
                            <span className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-600">
                              {project.status || "N/A"}
                            </span>
                          </td>

                          <td className="min-w-40 p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-full rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-red-600"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        Number(project.progress || 0)
                                      )
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="text-sm text-gray-600">
                                {project.progress || 0}%
                              </span>
                            </div>
                          </td>

                          <td className="p-3 text-sm text-gray-600">
                            {project.start_date || "-"}
                          </td>

                          <td className="p-3 text-sm text-gray-600">
                            {project.end_date || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProjectDashboard;