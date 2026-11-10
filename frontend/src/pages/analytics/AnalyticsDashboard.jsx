import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "react-toastify";
import api from "../../api/axios";

const COLORS = ["#dc2626", "#f87171", "#991b1b", "#fecaca"];

function formatLabel(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : value.toFixed(2);
  }

  return String(value);
}

function AnalyticsDashboard() {
  const [dashboard, setDashboard] = useState({});
  const [projectAnalytics, setProjectAnalytics] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState({});
  const [monthlyReport, setMonthlyReport] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [
        dashboardResponse,
        projectsResponse,
        teamResponse,
        weeklyResponse,
        monthlyResponse,
      ] = await Promise.all([
        api.get("/analytics/dashboard"),
        api.get("/analytics/projects"),
        api.get("/analytics/team-performance"),
        api.get("/analytics/weekly-report"),
        api.get("/analytics/monthly-report"),
      ]);

      setDashboard(dashboardResponse.data || {});
      setProjectAnalytics(
        Array.isArray(projectsResponse.data)
          ? projectsResponse.data
          : []
      );
      setTeamPerformance(
        Array.isArray(teamResponse.data)
          ? teamResponse.data
          : []
      );
      setWeeklyReport(weeklyResponse.data || {});
      setMonthlyReport(monthlyResponse.data || {});
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to load analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const dashboardCards = Object.entries(dashboard).filter(
    ([, value]) =>
      typeof value === "number" || typeof value === "boolean"
  );

  const getChartData = (items, labelCandidates) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items.map((item, index) => {
      const labelKey = labelCandidates.find(
        (key) => item[key] !== undefined && item[key] !== null
      );

      const label = labelKey
        ? item[labelKey]
        : `Item ${index + 1}`;

      const numericFields = Object.entries(item).filter(
        ([, value]) => typeof value === "number"
      );

      const result = {
        name: String(label),
      };

      numericFields.forEach(([key, value]) => {
        result[formatLabel(key)] = value;
      });

      return result;
    });
  };

  const projectChartData = getChartData(projectAnalytics, [
    "project_name",
    "name",
    "title",
    "project_id",
    "id",
  ]);

  const teamChartData = getChartData(teamPerformance, [
    "user_name",
    "name",
    "user_id",
    "id",
  ]);

  const getNumericReportValues = (report) => {
    return Object.entries(report).filter(
      ([, value]) => typeof value === "number"
    );
  };

  const renderReport = (title, report) => {
    const values = getNumericReportValues(report);

    return (
      <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-red-600">
          {title}
        </h3>

        {values.length === 0 ? (
          <p className="text-sm text-gray-500">
            No numeric report data available.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {values.map(([key, value]) => (
              <div key={key} className="rounded-md bg-gray-50 p-3">
                <p className="text-sm text-gray-500">
                  {formatLabel(key)}
                </p>

                <p className="mt-1 text-2xl font-bold text-red-600">
                  {formatValue(value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg font-medium text-red-600">
          Loading analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-600">
            Analytics Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Track projects, tasks and team productivity
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="rounded-md bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Refresh Analytics
        </button>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          Overall Statistics
        </h2>

        {dashboardCards.length === 0 ? (
          <p className="rounded-lg border border-gray-200 p-5 text-gray-500">
            No dashboard statistics available.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardCards.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-gray-200 p-5 shadow-sm"
              >
                <p className="text-sm text-gray-500">
                  {formatLabel(key)}
                </p>

                <h3 className="mt-2 text-3xl font-bold text-red-600">
                  {formatValue(value)}
                </h3>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-800">
            Project Analytics
          </h2>

          {projectChartData.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              No project analytics available.
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  {Object.keys(projectChartData[0])
                    .filter((key) => key !== "name")
                    .map((key) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill="#dc2626"
                      />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-800">
            Team Performance
          </h2>

          {teamChartData.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              No team performance data available.
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  {Object.keys(teamChartData[0])
                    .filter((key) => key !== "name")
                    .map((key) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill="#dc2626"
                      />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          Project Details
        </h2>

        {projectAnalytics.length === 0 ? (
          <p className="rounded-lg border border-gray-200 p-5 text-gray-500">
            No project records available.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-red-50 text-red-700">
                <tr>
                  {Object.keys(projectAnalytics[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-semibold">
                      {formatLabel(key)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {projectAnalytics.map((project, index) => (
                  <tr
                    key={project.id || project.project_id || index}
                    className="border-t border-gray-200"
                  >
                    {Object.values(project).map((value, valueIndex) => (
                      <td
                        key={valueIndex}
                        className="px-4 py-3 text-gray-700"
                      >
                        {formatValue(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {renderReport("Weekly Productivity Report", weeklyReport)}
        {renderReport("Monthly Productivity Report", monthlyReport)}
      </section>

      <section className="rounded-lg border border-gray-200 p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Team Performance Details
        </h2>

        {teamPerformance.length === 0 ? (
          <p className="text-gray-500">
            No team performance records available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-red-50 text-red-700">
                <tr>
                  {Object.keys(teamPerformance[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-semibold">
                      {formatLabel(key)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {teamPerformance.map((member, index) => (
                  <tr
                    key={member.user_id || member.id || index}
                    className="border-t border-gray-200"
                  >
                    {Object.values(member).map((value, valueIndex) => (
                      <td
                        key={valueIndex}
                        className="px-4 py-3 text-gray-700"
                      >
                        {formatValue(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AnalyticsDashboard;