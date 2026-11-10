import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";

function TeamManagement() {
  const organizationId = localStorage.getItem("organization_id");

  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    role: "TEAM_MEMBER",
  });
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    if (!organizationId) {
      toast.error("Organization ID not found");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        `/organizations/${organizationId}/members/`
      );

      setMembers(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to fetch members"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error("Please enter email");
      return;
    }

    try {
      const response = await api.post(
        `/organizations/${organizationId}/members/`,
        {
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
        }
      );

      toast.success(
        response.data.message || "Member added successfully"
      );

      setFormData({
        email: "",
        role: "TEAM_MEMBER",
      });

      fetchMembers();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to add member"
      );
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const response = await api.put(
        `/organizations/${organizationId}/members/${userId}`,
        { role }
      );

      toast.success(
        response.data.message || "Member role updated successfully"
      );

      fetchMembers();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to update role"
      );
    }
  };

  const handleRemoveMember = async (userId) => {
    const confirmRemove = window.confirm(
      "Are you sure you want to remove this member?"
    );

    if (!confirmRemove) return;

    try {
      const response = await api.delete(
        `/organizations/${organizationId}/members/${userId}`
      );

      toast.success(
        response.data.message || "Member removed successfully"
      );

      fetchMembers();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to remove member"
      );
    }
  };

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-white p-6">
        <h2 className="text-xl font-bold text-red-600">
          Organization not found
        </h2>
        <p className="mt-2 text-gray-600">
          Please create or select an organization first.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-red-600">
            Team Management
          </h1>

          <p className="mt-2 text-gray-600">
            Add members and manage organization roles.
          </p>
        </div>

        <div className="mb-8 rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">
            Add Team Member
          </h2>

          <form
            onSubmit={handleAddMember}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter registered user email"
              className="rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            >
              <option value="ADMIN">Admin</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="TEAM_MEMBER">Team Member</option>
            </select>

            <button
              type="submit"
              className="rounded-md bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
            >
              Add Member
            </button>
          </form>

          <p className="mt-3 text-sm text-gray-500">
            The user must register before being added to the organization.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Organization Members
            </h2>

            <button
              onClick={fetchMembers}
              className="rounded-md border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="py-6 text-center text-gray-500">
              Loading members...
            </p>
          ) : members.length === 0 ? (
            <p className="py-6 text-center text-gray-500">
              No members found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="p-3">User ID</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Update Role</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.user_id}
                      className="border-b border-gray-100"
                    >
                      <td className="p-3 font-medium text-gray-800">
                        {member.user_id}
                      </td>

                      <td className="p-3 text-gray-600">
                        {member.role}
                      </td>

                      <td className="p-3">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.user_id,
                              e.target.value
                            )
                          }
                          className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-red-600"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="PROJECT_MANAGER">
                            Project Manager
                          </option>
                          <option value="TEAM_MEMBER">
                            Team Member
                          </option>
                        </select>
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() =>
                            handleRemoveMember(member.user_id)
                          }
                          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamManagement;