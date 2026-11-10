import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import OrganizationDashboard from "../pages/organization/OrganizationDashboard";
import TeamManagement from "../pages/organization/TeamManagement";

import ProjectDashboard from "../pages/projects/ProjectDashboard";
import Projects from "../pages/projects/Projects";

import TaskBoard from "../pages/tasks/TaskBoard";
import TaskDetails from "../pages/tasks/TaskDetails";

import Notifications from "../pages/notifications/Notifications";
import AnalyticsDashboard from "../pages/analytics/AnalyticsDashboard";

import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/organization"
          element={<OrganizationDashboard />}
        />

        <Route
          path="/projects/dashboard"
          element={<ProjectDashboard />}
        />

        <Route
          path="/projects"
          element={<Projects />}
        />

        <Route
          path="/tasks"
          element={<TaskBoard />}
        />

        <Route
          path="/tasks/:taskId"
          element={<TaskDetails />}
        />

        <Route
          path="/notifications"
          element={<Notifications />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]} />
        }
      >
        <Route
          path="/team"
          element={<TeamManagement />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN", "PROJECT_MANAGER"]}
          />
        }
      >
        <Route
          path="/analytics"
          element={<AnalyticsDashboard />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/organization" replace />} />
    </Routes>
  );
}

export default AppRoutes;