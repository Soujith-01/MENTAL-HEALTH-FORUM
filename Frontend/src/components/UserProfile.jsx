import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-hot-toast";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  bodyText,
  mutedText,
  primaryBtn,
  secondaryBtn,
  loadingClass,
  errorClass,
  emptyStateClass,
  articleMeta,
  avatar,
} from "../styles/common";

const getInitial = (value) => value?.trim()?.charAt(0)?.toUpperCase() || "U";

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const reportReasons = [
    "Spam",
    "Harassment",
    "Fake Information",
    "Inappropriate Content",
    "Other",
  ];

  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const userRes = await axios.get(
          `http://localhost:3000/user-api/users/${userId}`,
          { withCredentials: true }
        );

        const postsRes = await axios.get(
          `http://localhost:3000/user-api/users/${userId}/posts`,
          { withCredentials: true }
        );

        setUser(userRes.data?.user || null);
        setPosts(Array.isArray(postsRes.data?.posts) ? postsRes.data.posts : []);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Unable to load user profile"
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const handleReportUser = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason");
      return;
    }

    setReporting(true);

    try {
      const res = await axios.post(
        `http://localhost:3000/admin-api/report-user/${userId}`,
        { reason: selectedReason },
        { withCredentials: true }
      );

      toast.success(res.data?.message || "User reported successfully");
      setReportModalOpen(false);
      setSelectedReason("");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "Unable to report user"
      );
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return <p className={loadingClass}>Loading user profile...</p>;
  }

  if (error) {
    return (
      <div className={pageBackground}>
        <div className={pageWrapper}>
          <div className={cardClass}>
            <p className={errorClass}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={pageBackground}>
        <div className={pageWrapper}>
          <div className={cardClass}>User not found.</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = String(currentUser?._id) === String(user._id);
  const postsByCategory = {};
  posts.forEach((post) => {
    postsByCategory[post.category] = (postsByCategory[post.category] || 0) + 1;
  });

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <section className={cardClass}>
          <div className="max-w-3xl space-y-6">
            {/* User Header */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="h-20 w-20 rounded-full object-cover border border-[#1f1f1f]"
                  />
                ) : (
                  <div className={`${avatar} h-20 w-20 text-2xl`}>
                    {getInitial(user.username)}
                  </div>
                )}
                <div>
                  <h1 className={pageTitleClass}>{user.username}</h1>
                  <p className={mutedText}>{user.email}</p>
                  <p className={`${mutedText} text-sm`}>
                    Joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>

              {!isOwnProfile && currentUser && (
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className={secondaryBtn}
                >
                  Report User
                </button>
              )}
            </div>

            {/* Bio */}
            {user.bio && <p className={bodyText}>{user.bio}</p>}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                <p className={mutedText}>Total Posts</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {posts.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                <p className={mutedText}>Categories</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {Object.keys(postsByCategory).length}
                </p>
              </div>
            </div>

            {/* Top Categories */}
            {Object.keys(postsByCategory).length > 0 && (
              <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                <p className="font-semibold text-white">Categories</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(postsByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([category, count]) => (
                      <span
                        key={category}
                        className="rounded-full bg-[#11A8E8] px-4 py-1 text-sm font-semibold text-white"
                      >
                        {category} ({count})
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* User's Posts */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Posts</h2>
              {posts.length ? (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post._id}
                      onClick={() => navigate(`/posts/${post._id}`)}
                      className="cursor-pointer rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4 transition-all hover:border-[#11A8E8]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className={`${mutedText} mt-1 text-sm`}>
                            {post.content
                              ? String(post.content).slice(0, 120)
                              : ""}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <span
                              className="rounded-full bg-[#1f1f1f] px-3 py-1 text-xs text-[#11A8E8]"
                            >
                              {post.category}
                            </span>
                            <span className={articleMeta}>
                              {post.createdAt
                                ? new Date(post.createdAt).toLocaleDateString()
                                : ""}
                            </span>
                          </div>
                        </div>
                        {post.image && (
                          <img
                            src={post.image}
                            alt="Post"
                            className="h-16 w-16 rounded-lg object-cover border border-[#1f1f1f]"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={emptyStateClass}>This user has not posted yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Report User Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-6 max-w-sm">
            <h2 className="text-lg font-semibold text-white">Report User</h2>
            <p className={`${mutedText} mt-2 text-sm`}>
              Please select a reason for reporting this user.
            </p>

            <div className="mt-4 space-y-2">
              {reportReasons.map((reason) => (
                <label key={reason} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="cursor-pointer"
                  />
                  <span className="text-white">{reason}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false);
                  setSelectedReason("");
                }}
                className={secondaryBtn}
                disabled={reporting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportUser}
                className={primaryBtn}
                disabled={reporting || !selectedReason}
              >
                {reporting ? "Reporting..." : "Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
