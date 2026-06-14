import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  primaryBtn,
  secondaryBtn,
  mutedText,
  emptyStateClass,
  errorClass,
} from "../styles/common";

function ReportedComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    loadReportedComments();
  }, []);

  const loadReportedComments = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        "http://localhost:3000/admin-api/reports/comments",
        { withCredentials: true }
      );

      setComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to load reported comments"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setSaving(true);

    try {
      const res = await axios.delete(
        `http://localhost:3000/admin-api/comments/${commentId}`,
        { withCredentials: true }
      );

      toast.success(res.data?.message || "Comment deleted");
      setComments(comments.filter(c => c.comment._id !== commentId));
      setConfirmModal(null);
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "Unable to delete comment"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-[#666666]">Loading reported comments...</div>;
  }

  if (error) {
    return <div className={errorClass}>{error}</div>;
  }

  if (!comments.length) {
    return <div className={emptyStateClass}>No reported comments.</div>;
  }

  return (
    <div className="space-y-3">
      {comments.map((entry) => (
        <div
          key={entry.comment._id}
          className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4"
        >
          <div className="space-y-2">
            <p className="font-semibold text-white">
              {entry.comment.content}
            </p>
            <p className={mutedText}>
              Post: {entry.postSnippet || "Unknown post"}
            </p>
            <p className={`${mutedText} text-sm`}>
              Reports: {entry.comment.reports?.length || 0}
            </p>

            {entry.comment.reports?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entry.comment.reports.map((report, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-[#1f1f1f] px-2 py-1 text-xs text-[#cfcfcf]"
                  >
                    {report.reason}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setConfirmModal({ type: "delete", commentId: entry.comment._id })
            }
            className={`${secondaryBtn} mt-3`}
            disabled={saving}
          >
            Delete Comment
          </button>
        </div>
      ))}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-6 max-w-sm">
            <h2 className="text-lg font-semibold text-white">Delete Comment</h2>
            <p className={`${mutedText} mt-2`}>
              Are you sure you want to delete this comment? This action cannot
              be undone.
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
                  handleDeleteComment(confirmModal.commentId)
                }
                className={primaryBtn}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportedComments;
