import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useAuthStore } from "../store/authStore";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  bodyText,
  emptyStateClass,
  errorClass,
} from "../styles/common";
import PostCard from "./PostCard";

function Feed() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFeed = async () => {
      try {
        const requests = [axios.get("http://localhost:3000/user-api/posts", { withCredentials: true })];

        if (currentUser?._id) {
          requests.push(
            axios.get("http://localhost:3000/user-api/me/saved-posts", {
              withCredentials: true,
            })
          );
        }

        const [postsRes, savedPostsRes] = await Promise.all(requests);

        if (!isMounted) {
          return;
        }

        const feedPosts = Array.isArray(postsRes.data?.posts) ? postsRes.data.posts : [];
        const currentUserId = currentUser?._id ? String(currentUser._id) : "";
        const visiblePosts = currentUserId
          ? feedPosts.filter((post) => {
              const postAuthorId = String(post?.author?.userId?._id || post?.author?.userId || "");
              return postAuthorId !== currentUserId;
            })
          : feedPosts;

        const sortedPosts = [...visiblePosts].sort((left, right) => {
          const leftTime = new Date(left?.createdAt || 0).getTime();
          const rightTime = new Date(right?.createdAt || 0).getTime();

          return rightTime - leftTime;
        });

        setPosts(sortedPosts);
        setSavedPostIds(
          (savedPostsRes?.data?.savedPosts || []).map((savedPost) => String(savedPost._id || savedPost))
        );
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError.response?.data?.message || "Unable to load recent posts");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFeed();

    return () => {
      isMounted = false;
    };
  }, [currentUser?._id]);

  const handleSavedStateChange = (postId, nextSaved) => {
    setSavedPostIds((currentSavedPostIds) => {
      const targetPostId = String(postId);

      if (nextSaved) {
        if (currentSavedPostIds.some((savedPostId) => String(savedPostId) === targetPostId)) {
          return currentSavedPostIds;
        }

        return [...currentSavedPostIds, targetPostId];
      }

      return currentSavedPostIds.filter((savedPostId) => String(savedPostId) !== targetPostId);
    });
  };

  if (!currentUser) {
    return (
      <div className={pageBackground}>
        <div className={pageWrapper}>
          <section className={cardClass}>
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[#11A8E8] font-bold">
                Recent Posts Feed
              </p>
              <h1 className={pageTitleClass}>Latest conversations from the community.</h1>
              <p className={bodyText}>
                Please log in to view posts.
              </p>
              <Link to="/login" className="inline-flex rounded-full border border-[#11A8E8] px-5 py-3 text-sm font-semibold text-[#11A8E8] transition hover:bg-[#11A8E8] hover:text-black">
                Login
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <section className={cardClass}>
          <div className="max-w-3xl space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-[#11A8E8] font-bold">
              Recent Posts Feed
            </p>
            <h1 className={pageTitleClass}>Latest conversations from the community.</h1>
          </div>

          {error ? (
            <div className={errorClass}>{error}</div>
          ) : loading ? (
            <div className={emptyStateClass}>Loading recent posts...</div>
          ) : posts.length ? (
            <div className="mt-8 flex flex-col gap-6 max-w-5xl mx-auto">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  savedPostIds={savedPostIds}
                  onSavedStateChange={handleSavedStateChange}
                  onDelete={(postId) => setPosts((currentPosts) => currentPosts.filter((item) => item._id !== postId))}
                />
              ))}
            </div>
          ) : (
            <div className={emptyStateClass}>No posts yet. Start the first conversation.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Feed;