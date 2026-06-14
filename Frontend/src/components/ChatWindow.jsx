import { useEffect, useRef } from "react";
import { articleMeta, bodyText, errorClass, emptyStateClass, primaryBtn, secondaryBtn, mutedText } from "../styles/common";

const resizeTextarea = (textarea) => {
  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString();
};

function ChatWindow({
  currentUser,
  selectedChat,
  messages = [],
  loading = false,
  sending = false,
  error = "",
  draft = "",
  setDraft,
  onSend,
  onDeleteChat,
  deleteLoading = false,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [draft, selectedChat?._id]);

  return (
    <section className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-5 lg:h-[calc(100vh-180px)] lg:flex lg:flex-col">
      {selectedChat ? (
        <>
          <div className="flex items-center justify-between gap-4 border-b border-[#1f1f1f] pb-4">
            <div className="flex items-center gap-3">
              <img
                src={selectedChat.avatar}
                alt={selectedChat.username}
                className="h-12 w-12 rounded-full object-cover border border-[#1f1f1f]"
              />
              <div>
                <p className="text-sm font-semibold text-white">{selectedChat.username}</p>
                <p className={mutedText}>{selectedChat.email || "Conversation"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeleteChat?.(selectedChat)}
              disabled={deleteLoading}
              className={`${secondaryBtn} disabled:opacity-60`}
            >
              {deleteLoading ? "Deleting..." : "Delete Chat"}
            </button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            {error ? <div className={errorClass}>{error}</div> : null}

            {loading ? (
              <div className={emptyStateClass}>Loading chat history...</div>
            ) : messages.length ? (
              <div className="flex flex-col gap-3">
                {messages.map((message) => {
                  const isMine = String(message.sender?._id || message.sender) === String(currentUser?._id);

                  return (
                    <div
                      key={message._id}
                      className={`max-w-[85%] rounded-3xl border px-4 py-3 ${
                        isMine
                          ? "ml-auto border-[#11A8E8]/30 bg-[#0f172a]"
                          : "border-[#1f1f1f] bg-[#050505]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#737373]">
                          {isMine ? "You" : selectedChat.username}
                        </p>
                        <span className={articleMeta}>{formatTime(message.createdAt)}</span>
                      </div>
                      <p className={`${bodyText} mt-2 wrap-break-word whitespace-pre-wrap`}>{message.content || ""}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={emptyStateClass}>No messages in this chat yet.</div>
            )}
          </div>

          <form onSubmit={onSend} className="mt-4 space-y-3 border-t border-[#1f1f1f] pt-4">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => {
                setDraft?.(event.target.value);
                resizeTextarea(event.currentTarget);
              }}
              rows="3"
              className="w-full h-24 resize-none overflow-hidden rounded-3xl border border-[#1f1f1f] bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-[#666666] outline-none focus:border-[#11A8E8] focus:ring-2 focus:ring-[#11A8E8]/20"
              placeholder="Write a message"
            />

            <div className="flex items-center justify-between gap-3">
              <p className={mutedText}>Messages wrap and the field expands while you type.</p>
              <button type="submit" disabled={sending || !selectedChat} className={primaryBtn}>
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-center">
          <div className="max-w-sm space-y-3">
            <p className="text-sm font-semibold text-white">No chat selected</p>
            <p className={mutedText}>Choose a conversation from the left or search a username to start one.</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default ChatWindow;