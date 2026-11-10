import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoadingUser(false);
        }
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const userData = response.data.user || response.data;

        if (isMounted) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (error) {
        console.error(
          "Failed to fetch user:",
          error.response?.data || error.message
        );

        try {
          const savedUser = JSON.parse(
            localStorage.getItem("user") || "null"
          );

          if (isMounted) {
            setUser(savedUser);
          }
        } catch {
          if (isMounted) {
            setUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const role = String(
    user?.role || user?.user?.role || ""
  )
    .split(".")
    .pop()
    .toUpperCase();

  const userName =
    user?.name ||
    user?.full_name ||
    user?.user?.name ||
    user?.email ||
    "User";

  const roleLinks = {
    ADMIN: [
      {
        name: "Organization",
        path: "/organization",
      },
      {
        name: "Dashboard",
        path: "/projects/dashboard",
      },
      {
        name: "Projects",
        path: "/projects",
      },
      {
        name: "Team",
        path: "/team",
      },
      {
        name: "Notifications",
        path: "/notifications",
      },
      {
        name: "Analytics",
        path: "/analytics",
      },
    ],

    PROJECT_MANAGER: [
      {
        name: "Organization",
        path: "/organization",
      },
      {
        name: "Dashboard",
        path: "/projects/dashboard",
      },
      {
        name: "Projects",
        path: "/projects",
      },
      {
        name: "Tasks",
        path: "/tasks",
      },
      {
        name: "Notifications",
        path: "/notifications",
      },
      {
        name: "Analytics",
        path: "/analytics",
      },
    ],

    TEAM_MEMBER: [
      {
        name: "Projects",
        path: "/projects",
      },
      {
        name: "Tasks",
        path: "/tasks",
      },
      {
        name: "Notifications",
        path: "/notifications",
      },
    ],
  };

  const filteredLinks = roleLinks[role] || [];

  const isActive = (path) => {
    if (path === "/tasks") {
      return location.pathname.startsWith("/tasks");
    }

    return location.pathname === path;
  };

  const handleNavigation = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("organization_id");

    setUser(null);
    setMenuOpen(false);

    toast.success("Logged out successfully");

    navigate("/login", { replace: true });
  };

  if (loadingUser) {
    return (
      <nav className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <span className="text-xl font-bold text-red-600">
            Project Management
          </span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

        <Link
          to="/organization"
          onClick={handleNavigation}
          className="text-xl font-bold text-red-600"
        >
          Project Management
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-md border border-red-600 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 md:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <div
          className={`${
            menuOpen ? "flex" : "hidden"
          } w-full flex-col gap-4 md:flex md:w-auto md:flex-row md:items-center`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleNavigation}
                className={`text-sm font-semibold transition ${
                  isActive(link.path)
                    ? "text-red-600"
                    : "text-gray-700 hover:text-red-600"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 md:flex-row md:items-center md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <div className="text-sm">
              <p className="font-semibold text-gray-800">
                {userName}
              </p>

              <p className="text-xs font-medium text-red-600">
                {role || "USER"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;