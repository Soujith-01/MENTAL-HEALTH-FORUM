import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router";
import {
  pageBackground,
  articlePageWrapper,
  articleHeader,
  articleCategory,
  articleAuthorRow,
  authorInfo,
  articleContent,
  articleFooter,
  articleMeta,
  cardClass,
  loadingClass,
  errorClass,
  primaryBtn,
  secondaryBtn,
  tagClass,
  commentsWrapper,
  commentCard,
  commentHeader,
  commentUser,
  commentTime,
  commentText,
  avatar,
} from "../styles/common";

const getInitial = (value) => value?.trim()?.charAt(0)?.toUpperCase() || "A";

function PostDetails() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState("");

  useEffect(() => {
    const loadPost = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/user-api/posts/${postId}`);
        setPost(res.data?.post || null);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load post");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  if (loading) {
    return <p className={loadingClass}>Loading post...</p>;
  }

  if (error) {
    return (
      <div className={pageBackground}>
        <div className={articlePageWrapper}>
          <p className={errorClass}>{error}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={pageBackground}>
        <div className={articlePageWrapper}>
          <div className={cardClass}>Post not found.</div>
        </div>
      </div>
    );
  }

  const handleReportComment = async (commentId) => {
    if (!post?._id || !commentId || reportingCommentId) {
      return;
    }

    setReportingCommentId(commentId);

    try {
      const res = await axios.post(
        `http://localhost:3000/user-api/posts/${post._id}/comments/${commentId}/report`,
        { reason: "Comment reported from post detail" },
        { withCredentials: true }
      );

      alert(res.data?.message || "Comment reported");
    } catch (requestError) {
      alert(requestError.response?.data?.message || "Unable to report comment");
    } finally {
      setReportingCommentId("");
    }
  };

  return (
    <div className={pageBackground}>
      <div className={articlePageWrapper}>
        <article className={cardClass}>
          <header className={articleHeader}>
            <p className={articleCategory}>{post.category || "Uncategorized"}</p>
            <div className={articleAuthorRow}>
              <div 
                className={`${authorInfo} ${!post.isAnonymous && post.author?.userId ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={() => {
                  if (!post.isAnonymous && post.author?.userId) {
                    const userId = typeof post.author.userId === 'string' ? post.author.userId : post.author.userId?._id;
                    if (userId) navigate(`/profile/${userId}`);
                  }
                }}
              >
                {post.author?.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.username || "User avatar"}
                    className="h-11 w-11 rounded-full object-cover border border-[#1f1f1f]"
                  />
                ) : (
                  <div className={avatar}>{getInitial(post.author?.username)}</div>
                )}
                <span>By {post.author?.username || "Anonymous User"}</span>
              </div>
              <span>{post.views || 0} views</span>
            </div>
          </header>

          {post.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className={tagClass}>
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {post.image ? (
            <div className="mt-6 flex justify-center">
              <img
                src={post.image}
                alt="Post image"
                className="w-full max-w-3xl max-h-80 rounded-3xl object-contain bg-[#080808] border border-[#1f1f1f]"
              />
            </div>
          ) : null}

          <div className={articleContent}>{post.content}</div>

          <footer className={articleFooter}>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <span className={articleMeta}>
                {post.reactions?.length || 0} reactions · {post.comments?.length || 0} comments
              </span>
              <div className="flex gap-3">
                <Link to="/saved-posts" className={secondaryBtn}>
                  Saved Posts
                </Link>
                <Link to="/create-post" className={primaryBtn}>
                  Create Another
                </Link>
              </div>
            </div>
          </footer>
        </article>

        {post.comments?.length ? (
          <section className={commentsWrapper}>
            {post.comments.map((comment) => (
              <div key={comment._id} className={commentCard}>
                <div className={commentHeader}>
                    <div className="flex items-center gap-3">
                      {comment.isAnonymous ? (
                        <div className={avatar}>A</div>
                      ) : comment.user?.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.username || "Comment avatar"}
                          className="h-9 w-9 rounded-full object-cover border border-[#1f1f1f]"
                        />
                      ) : (
                        <div className={avatar}>{getInitial(comment.user?.username)}</div>
                      )}
                      <span className={commentUser}>
                        {comment.isAnonymous ? "Anonymous User" : comment.user?.username || "User"}
                      </span>
                    </div>
                  <span className={commentTime}>
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                <p className={commentText}>{comment.content}</p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleReportComment(comment._id)}
                    className={`${secondaryBtn} px-3 py-2 text-xs`}
                    disabled={Boolean(reportingCommentId)}
                  >
                    Report
                  </button>
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default PostDetails;
