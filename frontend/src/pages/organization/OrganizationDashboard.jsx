import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";

function OrganizationDashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      localStorage.removeItem("user");
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

  const fetchOrganizations = async (preferredId = null) => {
    try {
      setLoading(true);

      const response = await api.get("/organizations/");

      const organizationList = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.organizations)
        ? response.data.organizations
        : [];

      setOrganizations(organizationList);

      if (organizationList.length === 0) {
        setSelectedOrganization(null);
        setMembers([]);
        setEditMode(false);
        localStorage.removeItem("organization_id");
        return;
      }

      const savedId =
        preferredId || localStorage.getItem("organization_id");

      const selected =
        organizationList.find(
          (org) => String(org.id) === String(savedId)
        ) || organizationList[0];

      await selectOrganization(selected.id);
    } catch (error) {
      console.error(
        "Organization loading error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to load organizations"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectOrganization = async (organizationId) => {
    try {
      const organizationResponse = await api.get(
        `/organizations/${organizationId}`
      );

      const organization = organizationResponse.data;

      setSelectedOrganization(organization);

      localStorage.setItem(
        "organization_id",
        String(organization.id)
      );

      setFormData({
        name: organization.name || "",
        description: organization.description || "",
      });

      setEditMode(false);

      try {
        const memberResponse = await api.get(
          `/organizations/${organizationId}/members/`
        );

        setMembers(
          Array.isArray(memberResponse.data)
            ? memberResponse.data
            : []
        );
      } catch (error) {
        setMembers([]);

        if (error.response?.status !== 403) {
          console.error(
            "Member loading error:",
            error.response?.data || error.message
          );
        }
      }
    } catch (error) {
      console.error(
        "Organization details error:",
        error.response?.data || error.message
      );

      setSelectedOrganization(null);
      setMembers([]);

      toast.error(
        error.response?.data?.detail ||
          "Failed to load organization details"
      );
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (token) {
          try {
            const response = await api.get("/auth/me");
            const userData = response.data.user || response.data;

            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } catch (error) {
            console.error(
              "User details loading error:",
              error.response?.data || error.message
            );
          }
        }

        await fetchOrganizations();
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error("Only Admin can create an organization");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/organizations/", {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      toast.success(
        response.data.message ||
          "Organization created successfully"
      );

      setFormData({
        name: "",
        description: "",
      });

      await fetchOrganizations(response.data.organization_id);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to create organization"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error("Only Admin can update an organization");
      return;
    }

    if (!selectedOrganization) {
      toast.error("Please select an organization");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        `/organizations/${selectedOrganization.id}`,
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
        }
      );

      toast.success(
        response.data.message ||
          "Organization updated successfully"
      );

      setEditMode(false);

      await fetchOrganizations(selectedOrganization.id);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to update organization"
      );
    } finally {
      setSaving(false);
    }
  };

  const adminCount = members.filter(
    (member) => member.role === "ADMIN"
  ).length;

  const managerCount = members.filter(
    (member) => member.role === "PROJECT_MANAGER"
  ).length;

  const teamMemberCount = members.filter(
    (member) => member.role === "TEAM_MEMBER"
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg font-medium text-red-600">
          Loading organization dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Organization Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              {isAdmin
                ? "Manage your organization and team members."
                : "View your assigned organization and team details."}
            </p>
          </div>

          <button
            onClick={() => fetchOrganizations()}
            disabled={loading}
            className="rounded-md border border-red-600 px-4 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {organizations.length > 0 && (
          <div className="mb-6">
            <label className="mb-2 block font-medium text-gray-700">
              Select Organization
            </label>

            <select
              value={selectedOrganization?.id || ""}
              onChange={(e) =>
                selectOrganization(Number(e.target.value))
              }
              className="w-full max-w-md rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!selectedOrganization ? (
          isAdmin ? (
            <div className="rounded-lg border border-gray-200 p-6 shadow-sm sm:p-8">
              <h2 className="mb-2 text-xl font-bold text-gray-800">
                Create Your Organization
              </h2>

              <p className="mb-6 text-sm text-gray-500">
                Create an organization to start managing projects and teams.
              </p>

              <form
                onSubmit={handleCreate}
                className="max-w-xl space-y-4"
              >
                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Organization Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter organization name"
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
                    placeholder="Enter organization description"
                    rows="4"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Organization"}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-gray-800">
                No Organization Assigned
              </h2>

              <p className="mt-2 text-gray-500">
                You are not assigned to any organization yet.
                Please contact your administrator.
              </p>
            </div>
          )
        ) : (
          <>
            <div className="mb-8 rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedOrganization.name}
                  </h2>

                  <p className="mt-2 text-gray-500">
                    {selectedOrganization.description ||
                      "No description available"}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Organization ID: {selectedOrganization.id}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="rounded-md bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
                  >
                    {editMode ? "Cancel" : "Edit Organization"}
                  </button>
                )}
              </div>

              {isAdmin && editMode && (
                <form
                  onSubmit={handleUpdate}
                  className="mt-6 max-w-xl space-y-4"
                >
                  <div>
                    <label className="mb-2 block font-medium text-gray-700">
                      Organization Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
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
                      rows="4"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}
            </div>

            <h2 className="mb-4 text-xl font-bold text-gray-800">
              Team Overview
            </h2>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Members
                </p>

                <h3 className="mt-2 text-3xl font-bold text-red-600">
                  {members.length}
                </h3>
              </div>

              <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Admins
                </p>

                <h3 className="mt-2 text-3xl font-bold text-red-600">
                  {adminCount}
                </h3>
              </div>

              <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Project Managers
                </p>

                <h3 className="mt-2 text-3xl font-bold text-red-600">
                  {managerCount}
                </h3>
              </div>

              <div className="rounded-lg border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Team Members
                </p>

                <h3 className="mt-2 text-3xl font-bold text-red-600">
                  {teamMemberCount}
                </h3>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold text-gray-800">
                Team Members
              </h2>

              {members.length === 0 ? (
                <p className="py-6 text-center text-gray-500">
                  No team members found or you don't have permission to view them.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left">
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

                          <td className="p-3">
                            <span className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-600">
                              {member.role}
                            </span>
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

export default OrganizationDashboard;