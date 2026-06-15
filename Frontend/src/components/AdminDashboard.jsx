import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  bodyText,
  errorClass,
  emptyStateClass,
  mutedText,
} from "../styles/common";
import AdminUsersPanel from "./AdminUsersPanel";
import AdminReportsPanel from "./AdminReportsPanel";
import AdminSystemNotificationPanel from "./AdminSystemNotificationPanel";
import ReportedUsers from "./ReportedUsers";
import ReportedComments from "./ReportedComments";

function AdminDashboard() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [users, setUsers] = useState([]);
  const [reportedPosts, setReportedPosts] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);
  const [systemMessage, setSystemMessage] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser?.role !== "ADMIN") {
      setLoading(false);
      return;
    }

    const loadAdminData = async () => {
      setLoading(true);
      setError("");

      try {
        const [usersRes, postsRes, commentsRes, statsRes] = await Promise.all([
          axios.get("/admin-api/users", { withCredentials: true }),
          axios.get("/admin-api/reports/posts", { withCredentials: true }),
          axios.get("/admin-api/reports/comments", { withCredentials: true }),
          axios.get("/admin-api/statistics", { withCredentials: true }),
        ]);

        setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
        setReportedPosts(Array.isArray(postsRes.data?.posts) ? postsRes.data.posts : []);
        setReportedComments(Array.isArray(commentsRes.data?.comments) ? commentsRes.data.comments : []);
        setStatistics(statsRes.data || null);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load admin data");
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [currentUser?.role]);

  const updateUserRole = async (userId, nextRole) => {
    setSaving(true);

    try {
      await axios.patch(
        `/admin-api/users/${userId}/role`,
        { role: nextRole },
        { withCredentials: true }
      );

      const updatedUsers = users.map((user) =>
        user._id === userId ? { ...user, role: nextRole } : user
      );
      setUsers(updatedUsers);
      toast.success("Role updated");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to update role");
    } finally {
      setSaving(false);
    }
  };

  const updateUserStatus = async (userId, isUserActive) => {
    setSaving(true);

    try {
      await axios.patch(
        `/admin-api/users/${userId}/status`,
        { isUserActive },
        { withCredentials: true }
      );

      const updatedUsers = users.map((user) =>
        user._id === userId ? { ...user, isUserActive } : user
      );
      setUsers(updatedUsers);
      toast.success("User status updated");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to update user status");
    } finally {
      setSaving(false);
    }
  };

  const sendSystemNotification = async (event) => {
    event.preventDefault();

    if (!systemMessage.trim()) {
      return;
    }

    setSaving(true);

    try {
      const res = await axios.post(
        "/admin-api/notifications/system",
        { message: systemMessage.trim() },
        { withCredentials: true }
      );

      setSystemMessage("");
      toast.success(res.data?.message || "System notification sent");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to send notification");
    } finally {
      setSaving(false);
    }
  };

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className={pageBackground}>
        <div className={pageWrapper}>
          <div className={cardClass}>
            <h1 className={pageTitleClass}>Admin Dashboard</h1>
            <p className={`${bodyText} mt-4`}>
              You do not have permission to access the admin routes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "reported-users", label: "Reported Users" },
    { id: "reported-comments", label: "Reported Comments" },
    { id: "system-statistics", label: "System Statistics" },
  ];

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <section className={cardClass}>
          <div className="max-w-4xl space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-[#11A8E8] font-bold">
                Admin
              </p>
              <h1 className={pageTitleClass}>Admin Dashboard</h1>
              <p className={bodyText}>
                Manage users, reports, and system notifications.
              </p>
            </div>

            {error && <div className={errorClass}>{error}</div>}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-[#1f1f1f]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "border-b-2 border-[#11A8E8] text-[#11A8E8]"
                      : "text-[#666666] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={emptyStateClass}>Loading admin data...</div>
            ) : (
              <div>
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {statistics && (
                        <>
                          <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                            <p className={mutedText}>Total Users</p>
                            <p className="mt-2 text-3xl font-bold text-white">
                              {statistics.totalUsers}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                            <p className={mutedText}>Active Users</p>
                            <p className="mt-2 text-3xl font-bold text-white">
                              {statistics.activeUsers}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                            <p className={mutedText}>Total Posts</p>
                            <p className="mt-2 text-3xl font-bold text-white">
                              {statistics.totalPosts}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                            <p className={mutedText}>Total Reports</p>
                            <p className="mt-2 text-3xl font-bold text-white">
                              {statistics.totalReports}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <AdminSystemNotificationPanel
                          value={systemMessage}
                          onChange={(event) => setSystemMessage(event.target.value)}
                          onSubmit={sendSystemNotification}
                          saving={saving}
                        />

                        <AdminReportsPanel
                          reportedPosts={reportedPosts}
                          reportedComments={reportedComments}
                        />
                      </div>

                      <AdminUsersPanel
                        users={users}
                        saving={saving}
                        onToggleRole={updateUserRole}
                        onToggleStatus={updateUserStatus}
                      />
                    </div>
                  </div>
                )}

                {/* Reported Users Tab */}
                {activeTab === "reported-users" && <ReportedUsers />}

                {/* Reported Comments Tab */}
                {activeTab === "reported-comments" && <ReportedComments />}

                {/* System Statistics Tab */}
                {activeTab === "system-statistics" && (
                  <div className="space-y-4">
                    {statistics && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-6">
                          <p className={mutedText}>Total Users</p>
                          <p className="mt-2 text-4xl font-bold text-white">
                            {statistics.totalUsers}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-6">
                          <p className={mutedText}>Active Users</p>
                          <p className="mt-2 text-4xl font-bold text-white">
                            {statistics.activeUsers}
                          </p>
                          <p className={`${mutedText} mt-2 text-sm`}>
                            {((statistics.activeUsers / statistics.totalUsers) * 100).toFixed(1)}% active
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-6">
                          <p className={mutedText}>Total Posts</p>
                          <p className="mt-2 text-4xl font-bold text-white">
                            {statistics.totalPosts}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-6">
                          <p className={mutedText}>Reported Users & Content</p>
                          <p className="mt-2 text-4xl font-bold text-white">
                            {statistics.totalReports}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;

