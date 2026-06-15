import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  primaryBtn,
  secondaryBtn,
  mutedText,
  emptyStateClass,
  errorClass,
  avatar,
} from "../styles/common";

const getInitial = (value) => value?.trim()?.charAt(0)?.toUpperCase() || "U";

function ReportedUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    loadReportedUsers();
  }, []);

  const loadReportedUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        "/admin-api/reported-users",
        { withCredentials: true }
      );

      setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to load reported users"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId) => {
    setSaving(true);

    try {
      const res = await axios.patch(
        `/admin-api/users/${userId}/deactivate`,
        {},
        { withCredentials: true }
      );

      toast.success(res.data?.message || "User deactivated");
      setConfirmModal(null);
      await loadReportedUsers();
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "Unable to deactivate user"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-[#666666]">Loading reported users...</div>;
  }

  if (error) {
    return <div className={errorClass}>{error}</div>;
  }

  if (!users.length) {
    return <div className={emptyStateClass}>No reported users.</div>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user._id}
          className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-12 w-12 rounded-full object-cover border border-[#1f1f1f]"
                />
              ) : (
                <div className={`${avatar} h-12 w-12`}>
                  {getInitial(user.username)}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-white">{user.username}</p>
                <p className={mutedText}>{user.email}</p>
                <p className={`${mutedText} mt-2 text-sm font-semibold`}>
                  Reports: {user.reports?.length || 0}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setConfirmModal({ type: "deactivate", userId: user._id })
              }
              className={secondaryBtn}
              disabled={saving || !user.isUserActive}
            >
              {user.isUserActive ? "Deactivate" : "Already Deactivated"}
            </button>
          </div>

          {user.reports?.length > 0 && (
            <div className="mt-3 border-t border-[#1f1f1f] pt-3">
              <p className={`${mutedText} text-xs font-semibold`}>
                Report Reasons:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {user.reports.map((report, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-[#1f1f1f] px-2 py-1 text-xs text-[#cfcfcf]"
                  >
                    {report.reason}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-6 max-w-sm">
            <h2 className="text-lg font-semibold text-white">Confirm Action</h2>
            <p className={`${mutedText} mt-2`}>
              Are you sure you want to deactivate this user? They will not be
              able to login.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className={secondaryBtn}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDeactivateUser(confirmModal.userId)
                }
                className={primaryBtn}
                disabled={saving}
              >
                {saving ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportedUsers;


