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
} from "../styles/common";

function SavedPosts() {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSavedPosts = async () => {
      try {
        const res = await axios.get("http://localhost:3000/user-api/me/saved-posts", {
          withCredentials: true,
        });

        setSavedPosts(res.data?.savedPosts || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load saved posts");
      } finally {
        setLoading(false);
      }
    };

    loadSavedPosts();
  }, []);

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <div className={cardClass}>
          <h1 className={pageTitleClass}>Saved Posts</h1>

          {error ? (
            <div className={emptyStateClass}>{error}</div>
          ) : loading ? (
            <div className={emptyStateClass}>Loading saved posts...</div>
          ) : savedPosts.length ? (
            <div className={`${articleGrid} mt-6`}>
              {savedPosts.map((post) => (
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
          ) : (
            <div className={emptyStateClass}>No saved posts yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedPosts;
