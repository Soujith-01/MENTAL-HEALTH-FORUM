import { secondaryBtn, mutedText } from "../styles/common";

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString();
};

function ChatList({
  chats = [],
  selectedChatId = null,
  searchQuery = "",
  setSearchQuery,
  searchResults = [],
  searchLoading = false,
  onSelectUser,
  onDeleteChat,
}) {
  return (
    <aside className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-5 lg:h-[calc(100vh-180px)] lg:overflow-y-auto">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-white">Chats</p>
          <p className={mutedText}>Search by username or open an existing conversation.</p>
        </div>

        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery?.(event.target.value)}
          className="w-full rounded-2xl border border-[#1f1f1f] bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-[#666666] outline-none focus:border-[#11A8E8] focus:ring-2 focus:ring-[#11A8E8]/20"
          placeholder="Search username"
        />

        {searchLoading ? <p className={mutedText}>Searching...</p> : null}

        {searchResults.length ? (
          <div className="space-y-2 rounded-2xl border border-[#1f1f1f] bg-[#050505] p-2">
            <p className="px-2 py-1 text-xs uppercase tracking-[0.3em] text-[#737373]">Start New Chat</p>
            {searchResults.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => onSelectUser?.(user)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-[#111111] ${
                  selectedChatId === user._id ? "bg-[#111111]" : ""
                }`}
              >
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-10 w-10 rounded-full object-cover border border-[#1f1f1f]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user.username}</p>
                  <p className={`${mutedText} truncate`}>{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          {chats.length ? (
            chats.map((chat) => {
              const user = chat.user || {};
              const isSelected = String(selectedChatId || "") === String(user._id || "");

              return (
                <div
                  key={user._id}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                    isSelected
                      ? "border-[#11A8E8] bg-[#0f172a]"
                      : "border-[#1f1f1f] bg-[#050505] hover:border-[#11A8E8]/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectUser?.(user)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-11 w-11 rounded-full object-cover border border-[#1f1f1f]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{user.username}</p>
                      <p className={`${mutedText} truncate`}>{chat.lastMessage?.content || "No messages yet"}</p>
                      <p className={`${mutedText} truncate`}>{formatTime(chat.lastMessage?.createdAt)}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteChat?.(user)}
                    className={`${secondaryBtn} shrink-0 px-3 py-2 text-xs`}
                  >
                    Delete
                  </button>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-[#1f1f1f] bg-[#050505] p-4 text-sm text-[#666666]">
              No chats yet.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default ChatList;
