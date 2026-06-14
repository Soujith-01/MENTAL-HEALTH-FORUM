import { mutedText, emptyStateClass } from "../styles/common";

function AdminReportsPanel({ reportedPosts = [], reportedComments = [] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-5">
        <p className="text-sm font-semibold text-white">Reported posts</p>
        {reportedPosts.length ? (
          <div className="mt-4 flex flex-col gap-3">
            {reportedPosts.map((post) => (
              <div key={post._id} className="rounded-2xl border border-[#1f1f1f] p-4">
                <p className={mutedText}>{post.content ? String(post.content).slice(0, 120) : ""}</p>
                <p className={`${mutedText} mt-2`}>{post.reports?.length || 0} reports</p>
              </div>
            ))}
          </div>
        ) : (
          <div className={emptyStateClass}>No reported posts.</div>
        )}
      </div>

      <div className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-5">
        <p className="text-sm font-semibold text-white">Reported comments</p>
        {reportedComments.length ? (
          <div className="mt-4 flex flex-col gap-3">
            {reportedComments.map((entry, index) => (
              <div key={entry.comment?._id || index} className="rounded-2xl border border-[#1f1f1f] p-4">
                <p className="text-sm font-semibold text-white">
                  {entry.comment?.content ? String(entry.comment.content).slice(0, 100) : "Comment"}
                </p>
                <p className={mutedText}>Post: {entry.postSnippet || "Unknown post"}</p>
                <p className={`${mutedText} mt-2`}>{entry.comment?.reports?.length || 0} reports</p>
              </div>
            ))}
          </div>
        ) : (
          <div className={emptyStateClass}>No reported comments.</div>
        )}
      </div>
    </div>
  );
}

export default AdminReportsPanel;