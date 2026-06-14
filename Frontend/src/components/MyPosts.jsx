import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  articleGrid,
  articleCardClass,
  articleExcerpt,
  articleMeta,
  emptyStateClass,
  secondaryBtn,
  primaryBtn,
} from "../styles/common";

const getSessionUser = () => {
  try {
    return JSON.parse(localStorage.getItem("mhf-user") || "null");
  } catch {
    return null;
  }
};

function MyPosts() {
  const [summary, setSummary] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getSessionUser();

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?._id) {
        setLoading(false);
        return;
      }

      try {
        const [dashboardRes, feedRes] = await Promise.all([
          axios.get("http://localhost:3000/user-api/dashboard", { withCredentials: true }),
          axios.get("http://localhost:3000/user-api/posts"),
        ]);

        setSummary(dashboardRes.data?.summary || null);
        const allPosts = feedRes.data?.posts || [];
        setPosts(
          allPosts.filter(
            (post) => String(post.author?.userId?._id || post.author?.userId || "") === String(currentUser._id)
          )
        );
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser?._id]);

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <div className={cardClass}>
          <h1 className={pageTitleClass}>My Posts</h1>
          <p className="text-sm text-[#9b9b9b] mt-3">
            This page filters live backend posts by the signed-in user.
          </p>

          {!currentUser?._id ? (
            <div className={emptyStateClass}>
              Sign in to view your posts.
              <div className="mt-4 flex justify-center gap-3">
                <Link to="/login" className={secondaryBtn}>
                  Login
                </Link>
                <Link to="/register" className={primaryBtn}>
                  Register
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className={emptyStateClass}>Loading your posts...</div>
          ) : posts.length ? (
            <>
              {summary ? (
                <div className="mt-6 grid gap-3 md:grid-cols-3 text-sm text-[#d4d4d4]">
                  <div className="rounded-2xl border border-[#1f1f1f] p-4">Posts: {summary.myPosts || 0}</div>
                  <div className="rounded-2xl border border-[#1f1f1f] p-4">Saved: {summary.savedPosts || 0}</div>
                  <div className="rounded-2xl border border-[#1f1f1f] p-4">Unread notifications: {summary.unreadNotifications || 0}</div>
                </div>
              ) : null}

              <div className={`${articleGrid} mt-6`}>
                {posts.map((post) => (
                  <article key={post._id} className={articleCardClass}>
                    <p className={articleMeta}>{post.category || "Uncategorized"}</p>
                    <p className={`${articleExcerpt} mt-3`}>{post.content}</p>
                    <div className="mt-5 flex gap-3">
                      <Link to={`/posts/${post._id}`} className={secondaryBtn}>
                        View
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className={emptyStateClass}>No posts found for this account yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyPosts;
