import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../store/authStore";
import {
  articleCardClass,
  articleCategory,
  articleExcerpt,
  articleMeta,
  articleBody,
  secondaryBtn,
  primaryBtn,
  tagClass,
  avatar,
  emptyStateClass,
} from "../styles/common";

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const getLikeCount = (post) =>
  post?.reactions?.filter((reaction) => reaction?.type === "like").length || 0;

const sortByRecent = (items) =>
  [...(items || [])].sort((left, right) => {
    const leftTime = new Date(left?.createdAt || 0).getTime();
    const rightTime = new Date(right?.createdAt || 0).getTime();

    return rightTime - leftTime;
  });

const getInitial = (value) => value?.trim()?.charAt(0)?.toUpperCase() || "A";

function PostCard({ post, onDelete, savedPostIds = [], onSavedStateChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const [currentPost, setCurrentPost] = useState(post);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    content: post?.content || "",
    category: post?.category || "",
    tags: (post?.tags || []).join(", "),
    isAnonymous: Boolean(post?.isAnonymous),
  });

  useEffect(() => {
    setCurrentPost(post);
    setEditForm({
      content: post?.content || "",
      category: post?.category || "",
      tags: (post?.tags || []).join(", "),
      isAnonymous: Boolean(post?.isAnonymous),
    });
    setIsEditing(false);
    setIsCommentsOpen(false);
    setCommentText("");
  }, [post]);

  useEffect(() => {
    const currentPostId = String(currentPost?._id || "");
    const saved = Array.isArray(savedPostIds)
      ? savedPostIds.some((savedPostId) => String(savedPostId) === currentPostId)
      : false;

    setIsSaved(saved);
  }, [savedPostIds, currentPost?._id]);

  const comments = useMemo(() => sortByRecent(currentPost?.comments), [currentPost?.comments]);
  const isOwner = Boolean(currentUser?._id && String(currentUser._id) === String(currentPost?.author?.userId));
  const saveButtonLabel = isSaved ? "Unsave" : "Save";

  const refreshPost = (nextPost) => {
    setCurrentPost((previousPost) => ({
      ...previousPost,
      ...nextPost,
    }));
  };

  const handleSavePost = async () => {
    if (!currentPost?._id || isSaving || isOwner) {
      return;
    }

    setIsSaving(true);

    try {
      if (isSaved) {
        await axios.delete(`/user-api/posts/${currentPost._id}/save`, {
          withCredentials: true,
        });

        setIsSaved(false);
        if (typeof onSavedStateChange === "function") {
          onSavedStateChange(currentPost._id, false);
        }
        toast.success("Post removed from saved posts");
      } else {
        await axios.post(`/user-api/posts/${currentPost._id}/save`, null, {
          withCredentials: true,
        });

        setIsSaved(true);
        if (typeof onSavedStateChange === "function") {
          onSavedStateChange(currentPost._id, true);
        }
        toast.success("Post saved");
      }
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to update saved post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLike = async () => {
    if (!currentPost?._id || actionLoading || isOwner) {
      return;
    }

    setActionLoading(true);

    try {
      const res = await axios.post(
        `/user-api/posts/${currentPost._id}/react`,
        { type: "like" },
        { withCredentials: true }
      );

      refreshPost({ reactions: res.data?.reactions || [] });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to update like");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!currentPost?._id || !commentText.trim() || actionLoading || isOwner) {
      return;
    }

    setActionLoading(true);

    try {
      const res = await axios.post(
        `/user-api/posts/${currentPost._id}/comments`,
        { content: commentText.trim(), isAnonymous: false },
        { withCredentials: true }
      );

      refreshPost({ comments: res.data?.comments || currentPost.comments || [] });
      setCommentText("");
      setIsCommentsOpen(true);
      toast.success("Comment added");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to add comment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportComment = async (commentId) => {
    if (!currentPost?._id || !commentId || actionLoading) {
      return;
    }

    setActionLoading(true);

    try {
      const res = await axios.post(
        `/user-api/posts/${currentPost._id}/comments/${commentId}/report`,
        { reason: "Comment reported from post card" },
        { withCredentials: true }
      );

      toast.success(res.data?.message || "Comment reported");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to report comment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!currentPost?._id || actionLoading || !isOwner) {
      return;
    }

    setActionLoading(true);

    try {
      await axios.delete(`/user-api/posts/${currentPost._id}`, {
        withCredentials: true,
      });

      toast.success("Post deleted");
      if (typeof onDelete === "function") {
        onDelete(currentPost._id);
      }
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to delete post");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!currentPost?._id || actionLoading || !isOwner) {
      return;
    }

    const nextTags = editForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    setActionLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", editForm.content.trim());
      formData.append("category", editForm.category.trim());
      formData.append("tags", nextTags.join(","));
      formData.append("isAnonymous", editForm.isAnonymous ? "true" : "false");

      const res = await axios.put(
        `/user-api/posts/${currentPost._id}`,
        formData,
        {
          withCredentials: true,
        }
      );

      refreshPost(res.data?.post || currentPost);
      setIsEditing(false);
      toast.success("Post updated");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to update post");
    } finally {
      setActionLoading(false);
    }
  };

  const authorName = currentPost?.author?.username || "Anonymous User";
  const authorAvatar = currentPost?.isAnonymous
    ? null
    : currentPost?.author?.avatar || currentPost?.author?.userId?.avatar || null;
  const avatarLabel = authorName?.trim()?.charAt(0)?.toUpperCase() || "A";
  const createdDate = formatDate(currentPost?.createdAt);
  const likeCount = getLikeCount(currentPost);
  const commentCount = currentPost?.comments?.length || 0;

  return (
    <article className={`${articleCardClass} overflow-hidden`}>
      <div
        className={`grid gap-6 transition-all duration-300 ${
          isCommentsOpen ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]" : "grid-cols-1"
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <div 
              className={`flex items-center gap-3 ${!currentPost?.isAnonymous && currentPost?.author?.userId ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => {
                if (!currentPost?.isAnonymous && currentPost?.author?.userId) {
                  const userId = typeof currentPost.author.userId === 'string' ? currentPost.author.userId : currentPost.author.userId?._id;
                  if (userId) navigate(`/profile/${userId}`);
                }
              }}
            >
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="h-11 w-11 rounded-full object-cover border border-[#1f1f1f]"
                />
              ) : (
                <div className={avatar}>{avatarLabel}</div>
              )}

              <div>
                <p className="text-sm font-semibold text-white">{authorName}</p>
                <p className={articleMeta}>{createdDate || "Recently posted"}</p>
              </div>
            </div>

            {isOwner ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing((previousValue) => !previousValue)}
                  className={secondaryBtn}
                >
                  {isEditing ? "Cancel Edit" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={actionLoading}
                  className={`${secondaryBtn} border-[#331717] text-[#f87171] hover:border-[#ef4444]/40`}
                >
                  {actionLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSavePost}
                disabled={isSaving}
                className={`${secondaryBtn} shrink-0 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isSaving ? "Saving..." : saveButtonLabel}
              </button>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className={articleCategory}>{currentPost?.category || "Uncategorized"}</p>
            <div className="flex items-center gap-3 text-xs text-[#737373]">
              <span>{likeCount} likes</span>
              <span>{commentCount} comments</span>
            </div>
          </div>

          {currentPost?.image ? (
            <img
              src={currentPost.image}
              alt="Post image"
              className="mt-4 w-full max-h-72 rounded-3xl object-contain bg-[#080808] border border-[#1f1f1f]"
            />
          ) : null}

          <p className={`${articleBody} mt-4`}>{currentPost?.content || ""}</p>

          {currentPost?.tags?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {currentPost.tags.map((tag) => (
                <span key={tag} className={tagClass}>
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="mt-6 space-y-4 rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Content</label>
                <textarea
                  value={editForm.content}
                  onChange={(event) => setEditForm((previousState) => ({ ...previousState, content: event.target.value }))}
                  rows={5}
                  className="w-full rounded-2xl border border-[#1f1f1f] bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-[#666666] outline-none focus:border-[#11A8E8] focus:ring-2 focus:ring-[#11A8E8]/20"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Category</label>
                  <input
                    value={editForm.category}
                    onChange={(event) => setEditForm((previousState) => ({ ...previousState, category: event.target.value }))}
                    className="w-full rounded-2xl border border-[#1f1f1f] bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-[#666666] outline-none focus:border-[#11A8E8] focus:ring-2 focus:ring-[#11A8E8]/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Tags</label>
                  <input
                    value={editForm.tags}
                    onChange={(event) => setEditForm((previousState) => ({ ...previousState, tags: event.target.value }))}
                    className="w-full rounded-2xl border border-[#1f1f1f] bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-[#666666] outline-none focus:border-[#11A8E8] focus:ring-2 focus:ring-[#11A8E8]/20"
                    placeholder="comma,separated,tags"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                <input
                  type="checkbox"
                  checked={editForm.isAnonymous}
                  onChange={(event) => setEditForm((previousState) => ({ ...previousState, isAnonymous: event.target.checked }))}
                  className="h-4 w-4"
                />
                Post anonymously
              </label>

              <div className="flex items-center justify-between gap-3">
                <p className={articleMeta}>Only the owner can edit this post.</p>
                <button type="submit" disabled={actionLoading} className={`${primaryBtn} disabled:opacity-70`}>
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={actionLoading}
                    className={`${primaryBtn} disabled:opacity-70`}
                  >
                    Like
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCommentsOpen((previousState) => !previousState)}
                    className={primaryBtn}
                  >
                    {isCommentsOpen ? "Hide Comments" : "Comment"}
                  </button>
                </>
              ) : (
                <span className={articleMeta}></span>
              )}

              <Link to={`/posts/${currentPost?._id}`} className={primaryBtn}>
                View Post
              </Link>
            </div>
          )}
        </div>

        {isCommentsOpen && !isOwner ? (
          <aside className="border-t border-[#1f1f1f] pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Recent Comments</p>
                <p className={articleMeta}>{commentCount} total</p>
              </div>
              <button type="button" onClick={() => setIsCommentsOpen(false)} className={secondaryBtn}>
                Close
              </button>
            </div>

            <div className="mt-4 max-h-85 overflow-y-auto pr-1 flex flex-col gap-3">
              {comments.length ? (
                comments.map((comment) => (
                  <div key={comment._id} className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                    <div className="flex items-center justify-between gap-3">
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
                        <p className="text-sm font-semibold text-white">
                          {comment.isAnonymous ? "Anonymous User" : comment.user?.username || "User"}
                        </p>
                      </div>
                      <span className={articleMeta}>
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className={`${articleExcerpt} mt-2 text-[#cfcfcf]`}>{comment.content}</p>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleReportComment(comment._id)}
                        className={`${secondaryBtn} px-3 py-2 text-xs`}
                        disabled={actionLoading}
                      >
                        Report
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={emptyStateClass}>No comments yet.</div>
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="mt-5 space-y-3">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment..."
                rows={4}
                className="w-full rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] px-4 py-3 text-sm text-white placeholder:text-[#666666] outline-none focus:border-[#11A8E8] focus:ring-2 focus:ring-[#11A8E8]/20"
              />
              <div className="flex items-center justify-between gap-3">
                <p className={articleMeta}>Add a supportive reply below.</p>
                <button
                  type="submit"
                  disabled={actionLoading || !commentText.trim()}
                  className={`${primaryBtn} disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  Post Comment
                </button>
              </div>
            </form>
          </aside>
        ) : null}
      </div>
    </article>
  );
}

export default PostCard;

