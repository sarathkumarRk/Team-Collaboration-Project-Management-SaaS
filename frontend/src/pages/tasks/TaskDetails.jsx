import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";

function TaskDetails() {
  const { taskId } = useParams();

  const [task, setTask] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [activities, setActivities] = useState([]);
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [assignedTo, setAssignedTo] = useState("");
  const [dependencyId, setDependencyId] = useState("");
  const [comment, setComment] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const statuses = [
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "COMPLETED",
  ];

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);

      const [
        taskResponse,
        dependencyResponse,
        activityResponse,
        commentResponse,
      ] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/dependencies`),
        api.get(`/tasks/${taskId}/activities`),
        api.get(`/comments/task/${taskId}`),
      ]);

      setTask(taskResponse.data);
      setDependencies(dependencyResponse.data);
      setActivities(activityResponse.data);
      setComments(commentResponse.data);

      setAssignedTo(taskResponse.data.assigned_to || "");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load task details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;

    try {
      setSaving(true);

      await api.put(`/tasks/${taskId}`, {
        status: newStatus,
      });

      toast.success("Task status updated successfully");

      await fetchTaskDetails();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to update task status"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();

    if (!assignedTo) {
      toast.error("Please enter user ID");
      return;
    }

    try {
      setSaving(true);

      await api.patch(`/tasks/${taskId}/assign`, {
        assigned_to: Number(assignedTo),
      });

      toast.success("Task assigned successfully");

      await fetchTaskDetails();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to assign task"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddDependency = async (e) => {
    e.preventDefault();

    if (!dependencyId) {
      toast.error("Please enter dependency task ID");
      return;
    }

    try {
      setSaving(true);

      await api.post(`/tasks/${taskId}/dependencies`, {
        depends_on_task_id: Number(dependencyId),
      });

      toast.success("Task dependency added successfully");

      setDependencyId("");

      await fetchTaskDetails();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to add dependency"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setSaving(true);

      await api.post("/comments/", {
        task_id: Number(taskId),
        content: comment.trim(),
      });

      toast.success("Comment added successfully");

      setComment("");

      await fetchTaskDetails();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to add comment"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setSaving(true);

      await api.put(`/comments/${commentId}`, {
        content: editingContent.trim(),
      });

      toast.success("Comment updated successfully");

      setEditingCommentId(null);
      setEditingContent("");

      await fetchTaskDetails();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to update comment"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/comments/${commentId}`);

      toast.success("Comment deleted successfully");

      await fetchTaskDetails();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to delete comment"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-red-600">
          Loading task details...
        </p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-white p-6">
        <h2 className="text-xl font-bold text-red-600">
          Task not found
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Task Details
            </h1>

            <p className="mt-2 text-gray-500">
              View and manage your task information.
            </p>
          </div>

          <button
            onClick={fetchTaskDetails}
            className="rounded-md border border-red-600 px-5 py-2 text-red-600 hover:bg-red-50"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-800">
            {task.title}
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Task ID</p>
              <p className="mt-1 font-medium text-gray-800">
                {task.id}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Project ID</p>
              <p className="mt-1 font-medium text-gray-800">
                {task.project_id}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Priority</p>
              <p className="mt-1 font-medium text-red-600">
                {task.priority}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Assigned To</p>
              <p className="mt-1 font-medium text-gray-800">
                {task.assigned_to || "Not assigned"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="mt-1 font-medium text-gray-800">
                {task.due_date
                  ? String(task.due_date).slice(0, 10)
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="mt-1 font-medium text-gray-800">
                {task.created_by || "-"}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm text-gray-500">
              Description
            </p>

            <p className="text-gray-700">
              {task.description || "No description available"}
            </p>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-5">
            <label className="mb-2 block font-medium text-gray-700">
              Update Task Status
            </label>

            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={saving}
              className="w-full max-w-sm rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">
            Assign Task
          </h2>

          <form
            onSubmit={handleAssignTask}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="number"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Enter user ID"
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-red-600 px-6 py-3 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Assign Task
            </button>
          </form>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">
            Task Dependencies
          </h2>

          <form
            onSubmit={handleAddDependency}
            className="mb-6 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="number"
              value={dependencyId}
              onChange={(e) => setDependencyId(e.target.value)}
              placeholder="Enter dependent task ID"
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-red-600 px-6 py-3 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Add Dependency
            </button>
          </form>

          {dependencies.length === 0 ? (
            <p className="py-4 text-center text-gray-500">
              No dependencies found.
            </p>
          ) : (
            <div className="space-y-3">
              {dependencies.map((dependency, index) => (
                <div
                  key={dependency.id || index}
                  className="rounded-md border border-gray-200 p-4"
                >
                  <p className="font-medium text-gray-800">
                    Depends on Task ID:{" "}
                    {dependency.depends_on_task_id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">
            Comments
          </h2>

          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment... Use @userId to mention someone."
              rows="3"
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
            />

            <button
              type="submit"
              disabled={saving}
              className="mt-3 rounded-md bg-red-600 px-6 py-3 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Add Comment
            </button>
          </form>

          {comments.length === 0 ? (
            <p className="py-4 text-center text-gray-500">
              No comments available.
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-gray-200 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-800">
                      User ID: {item.user_id}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  {editingCommentId === item.id ? (
                    <div>
                      <textarea
                        value={editingContent}
                        onChange={(e) =>
                          setEditingContent(e.target.value)
                        }
                        rows="3"
                        className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
                      />

                      <div className="mt-3 flex gap-3">
                        <button
                          onClick={() =>
                            handleEditComment(item.id)
                          }
                          disabled={saving}
                          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                          Save
                        </button>

                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingContent("");
                          }}
                          className="rounded-md border border-gray-300 px-4 py-2 text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-gray-700">
                        {item.content}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            setEditingCommentId(item.id);
                            setEditingContent(item.content);
                          }}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteComment(item.id)
                          }
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">
            Activity History
          </h2>

          {activities.length === 0 ? (
            <p className="py-4 text-center text-gray-500">
              No activity history found.
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="border-l-2 border-red-600 py-2 pl-4"
                >
                  <p className="font-semibold text-gray-800">
                    {activity.action}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {activity.description}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    User ID: {activity.user_id}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {activity.created_at
                      ? new Date(
                          activity.created_at
                        ).toLocaleString()
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default TaskDetails;