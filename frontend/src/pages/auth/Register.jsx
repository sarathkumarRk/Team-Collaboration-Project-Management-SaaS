import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "TEAM_MEMBER",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      toast.error("Please fill all fields");
      return;
    }

    if (formData.password.length < 3) {
      toast.error("Password must contain at least 3 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      });

      toast.success(
        response.data.message || "Registration successful!"
      );

      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-gray-200 p-8 shadow-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-red-600">
          Create Account
        </h1>

        <p className="mb-6 text-center text-gray-500">
          Register for Project Management Platform
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
              minLength={3}
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            />

            <p className="mt-1 text-sm text-gray-500">
              Minimum 3 characters
            </p>
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Select Role
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            >
              <option value="ADMIN">Admin</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="TEAM_MEMBER">Team Member</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-red-600 hover:text-red-700"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;