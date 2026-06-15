import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from "react-router";
import { useAuthStore } from "../store/authStore";
import PostCard from "./PostCard";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  bodyText,
  mutedText,
  inputClass,
  primaryBtn,
  secondaryBtn,
  emptyStateClass,
  errorClass,
} from "../styles/common";

function Discover() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get("/user-api/categories");
        setCategories(Array.isArray(res.data?.categories) ? res.data.categories : []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load categories");
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setLoading(true);
      setError("");

      try {
        const endpoint = searchQuery
          ? `/user-api/posts/search?q=${encodeURIComponent(searchQuery)}`
          : selectedCategory
            ? `/user-api/categories/${encodeURIComponent(selectedCategory)}/posts`
            : "/user-api/posts";

        const requests = [axios.get(endpoint, { withCredentials: true })];

        if (currentUser?._id) {
          requests.push(
            axios.get("/user-api/me/saved-posts", {
              withCredentials: true,
            })
          );
        }

        const [postsRes, savedPostsRes] = await Promise.all(requests);

        if (!isMounted) {
          return;
        }

        const discoveredPosts = Array.isArray(postsRes.data?.posts) ? postsRes.data.posts : [];

        setPosts(discoveredPosts);
        setSavedPostIds(
          (savedPostsRes?.data?.savedPosts || []).map((savedPost) => String(savedPost._id || savedPost))
        );
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError.response?.data?.message || "Unable to load posts");
        toast.error(requestError.response?.data?.message || "Unable to load posts");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [currentUser?._id, searchQuery, selectedCategory]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSelectedCategory("");
    setSearchQuery(searchInput.trim());
  };

  const handleCategorySelect = (category) => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedCategory(category);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedCategory("");
  };

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
                Discover
              </p>
              <h1 className={pageTitleClass}>Search posts by keyword or category.</h1>
              <p className={bodyText}>
                Please log in to discover posts and categories.
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[#11A8E8] font-bold">
                Discover
              </p>
              <h1 className={pageTitleClass}>Search posts by keyword or category.</h1>
            </div>

            <button type="button" onClick={handleClearFilters} className={secondaryBtn}>
              Clear Filters
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by content, tag, or category"
              className={`${inputClass} flex-1`}
            />
            <button type="submit" className={primaryBtn}>
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategorySelect("")}
              className={`${secondaryBtn} ${!selectedCategory ? "border-[#11A8E8]" : ""}`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategorySelect(category)}
                className={`${secondaryBtn} ${selectedCategory === category ? "border-[#11A8E8]" : ""}`}
              >
                {category}
              </button>
            ))}
          </div>

          {(searchQuery || selectedCategory) && (
            <p className={`${mutedText} mt-4`}>
              Showing {searchQuery ? `results for “${searchQuery}”` : `posts in ${selectedCategory}`}
            </p>
          )}

          {error ? (
            <div className={errorClass}>{error}</div>
          ) : loading ? (
            <div className={emptyStateClass}>Loading posts...</div>
          ) : posts.length ? (
            <div className="mt-8 flex flex-col gap-6">
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
            <div className={emptyStateClass}>No posts found for the current filters.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Discover;

