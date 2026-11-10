import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";

const initialForm = {
  user_id: "",
  recipient_email: "",
  event_type: "",
  subject: "",
  message: "",
  scheduled_at: "",
};

const statusStyles = {
  SENT: "bg-green-50 text-green-700",
  PENDING: "bg-yellow-50 text-yellow-700",
  FAILED: "bg-red-50 text-red-700",
};

export default function Notifications() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "ADMIN";

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [showCreate, setShowCreate] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [form, setForm] = useState(initialForm);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const endpoint = isAdmin
        ? "/notifications/all"
        : "/notifications/";

      const response = await api.get(endpoint);

      setNotifications(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Notification Error:", error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.subject?.toLowerCase().includes(search.toLowerCase()) ||
        notification.message?.toLowerCase().includes(search.toLowerCase()) ||
        notification.recipient_email?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "ALL" ||
        notification.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [notifications, search, filterStatus]);

  const counts = {
    total: notifications.length,
    sent: notifications.filter((n) => n.status === "SENT").length,
    pending: notifications.filter((n) => n.status === "PENDING").length,
    failed: notifications.filter((n) => n.status === "FAILED").length,
  };

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();

    if (
      !form.recipient_email ||
      !form.event_type ||
      !form.subject ||
      !form.message
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        user_id: form.user_id ? Number(form.user_id) : null,
        recipient_email: form.recipient_email,
        event_type: form.event_type,
        subject: form.subject,
        message: form.message,
        scheduled_at: form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : null,
      };

      await api.post("/notifications/send", payload);

      toast.success("Notification created successfully");

      setForm(initialForm);
      setShowCreate(false);

      await fetchNotifications();
    } catch (error) {
      console.error("Create Notification Error:", error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to create notification"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async (notificationId) => {
    try {
      setRetryingId(notificationId);

      const response = await api.post(
        `/notifications/${notificationId}/retry`
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? response.data
            : notification
        )
      );

      toast.success("Notification retry completed");
    } catch (error) {
      console.error("Retry Error:", error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to retry notification"
      );
    } finally {
      setRetryingId(null);
    }
  };

  const handleViewDetails = async (notificationId) => {
    try {
      const response = await api.get(
        `/notifications/${notificationId}`
      );

      setSelectedNotification(response.data);
    } catch (error) {
      console.error("Notification Details Error:", error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to load notification details"
      );
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage and monitor notification delivery.
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            + Create Notification
          </button>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Notifications",
              value: counts.total,
            },
            {
              label: "Sent",
              value: counts.sent,
            },
            {
              label: "Pending",
              value: counts.pending,
            },
            {
              label: "Failed",
              value: counts.failed,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <p className="text-sm text-gray-500">
                {item.label}
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500 md:max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            {["ALL", "SENT", "PENDING", "FAILED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filterStatus === status
                    ? "bg-red-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Notification History
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="font-semibold text-gray-800">
                No notifications found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Notifications will appear here when available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    {isAdmin && (
                      <th className="px-5 py-4">User ID</th>
                    )}

                    <th className="px-5 py-4">Notification</th>
                    <th className="px-5 py-4">Recipient</th>
                    <th className="px-5 py-4">Event Type</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created At</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <tr
                      key={notification.id}
                      className="hover:bg-gray-50"
                    >
                      {isAdmin && (
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {notification.user_id ?? "-"}
                        </td>
                      )}

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {notification.subject}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                          {notification.message}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {notification.recipient_email}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {notification.event_type}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[notification.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {notification.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(notification.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleViewDetails(notification.id)
                            }
                            className="text-sm font-semibold text-red-600 hover:underline"
                          >
                            View
                          </button>

                          {notification.status === "FAILED" && (
                            <button
                              onClick={() =>
                                handleRetry(notification.id)
                              }
                              disabled={retryingId === notification.id}
                              className="text-sm font-semibold text-gray-700 hover:underline disabled:opacity-50"
                            >
                              {retryingId === notification.id
                                ? "Retrying..."
                                : "Retry"}
                            </button>
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

        <div className="mt-5 flex justify-end">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Create Notification
              </h2>

              <button
                onClick={() => setShowCreate(false)}
                className="text-2xl text-gray-500 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateNotification}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  User ID (optional)
                </label>

                <input
                  type="number"
                  name="user_id"
                  value={form.user_id}
                  onChange={handleFormChange}
                  placeholder="Enter user ID"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Recipient Email *
                </label>

                <input
                  type="email"
                  name="recipient_email"
                  value={form.recipient_email}
                  onChange={handleFormChange}
                  required
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Event Type *
                </label>

                <input
                  type="text"
                  name="event_type"
                  value={form.event_type}
                  onChange={handleFormChange}
                  required
                  placeholder="TASK_ASSIGNED"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subject *
                </label>

                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleFormChange}
                  required
                  placeholder="Notification subject"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Message *
                </label>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleFormChange}
                  required
                  rows={4}
                  placeholder="Enter notification message"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Schedule At (optional)
                </label>

                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={form.scheduled_at}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Notification Details
              </h2>

              <button
                onClick={() => setSelectedNotification(null)}
                className="text-2xl text-gray-500 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Subject</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedNotification.subject}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Recipient</p>
                <p className="mt-1 text-sm text-gray-800">
                  {selectedNotification.recipient_email}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Event Type</p>
                <p className="mt-1 text-sm text-gray-800">
                  {selectedNotification.event_type}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Message</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                  {selectedNotification.message}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    statusStyles[selectedNotification.status] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {selectedNotification.status}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500">Error Message</p>
                <p className="mt-1 text-sm text-red-600">
                  {selectedNotification.error_message || "No errors"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Created At</p>
                <p className="mt-1 text-sm text-gray-800">
                  {formatDate(selectedNotification.created_at)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Sent At</p>
                <p className="mt-1 text-sm text-gray-800">
                  {formatDate(selectedNotification.sent_at)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}