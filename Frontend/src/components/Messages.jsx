import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  bodyText,
  mutedText,
  errorClass,
  emptyStateClass,
  inputClass,
} from "../styles/common";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

function Messages() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [recipientResults, setRecipientResults] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadConversation = async (chatUserId) => {
    if (!chatUserId || !currentUser?._id) {
      setChatMessages([]);
      return;
    }

    setHistoryLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `http://localhost:3000/message-api/messages/conversation/${chatUserId}`,
        {
          withCredentials: true,
        }
      );

      setChatMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load chat history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?._id) {
      setChatsLoading(false);
      return;
    }

    const loadChats = async () => {
      setChatsLoading(true);
      setError("");

      try {
        const res = await axios.get("http://localhost:3000/message-api/chats", {
          withCredentials: true,
        });

        const nextChats = Array.isArray(res.data?.chats) ? res.data.chats : [];
        setChats(nextChats);

        if (!selectedChat && nextChats.length) {
          setSelectedChat(nextChats[0].user || null);
        }
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load chats");
      } finally {
        setChatsLoading(false);
      }
    };

    loadChats();
  }, [currentUser?._id, selectedChat]);

  useEffect(() => {
    const loadRecipients = async () => {
      const query = chatSearchQuery.trim();

      if (!query) {
        setRecipientResults([]);
        return;
      }

      setSearching(true);

      try {
        const res = await axios.get(
          `http://localhost:3000/message-api/users/search?username=${encodeURIComponent(query)}`,
          { withCredentials: true }
        );

        setRecipientResults(Array.isArray(res.data?.users) ? res.data.users : []);
      } catch (requestError) {
        setRecipientResults([]);
        setError(requestError.response?.data?.message || "Unable to search users");
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(loadRecipients, 250);

    return () => clearTimeout(timeoutId);
  }, [chatSearchQuery]);

  useEffect(() => {
    loadConversation(selectedChat?._id);
  }, [selectedChat?._id, currentUser?._id]);

  const chatSearchMatches = useMemo(() => {
    return recipientResults.filter((user) => String(user._id) !== String(currentUser?._id));
  }, [recipientResults, currentUser?._id]);

  const refreshChats = async (preferredSelectedId = null) => {
    const res = await axios.get("http://localhost:3000/message-api/chats", {
      withCredentials: true,
    });

    const nextChats = Array.isArray(res.data?.chats) ? res.data.chats : [];
    setChats(nextChats);

    if (preferredSelectedId) {
      const matchedChat = nextChats.find((chat) => String(chat.user?._id) === String(preferredSelectedId));
      if (matchedChat) {
        setSelectedChat(matchedChat.user);
        return;
      }
    }

    if (!nextChats.length) {
      setSelectedChat(null);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedChat(user);
    setChatSearchQuery("");
    setRecipientResults([]);
  };

  const handleSend = async (event) => {
    event.preventDefault();

    if (!draft.trim() || !selectedChat?._id) {
      setError("select a chat and enter a message");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:3000/message-api/messages",
        { receiverId: selectedChat._id, content: draft.trim() },
        { withCredentials: true }
      );

      setDraft("");
      setRecipientResults([]);
      toast.success(res.data?.message || "Message sent");

      await Promise.all([refreshChats(selectedChat._id), loadConversation(selectedChat._id)]);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to send message";
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async (user) => {
    if (!user?._id) {
      return;
    }

    setDeleteLoading(true);
    setError("");

    try {
      const res = await axios.delete(
        `http://localhost:3000/message-api/messages/conversation/${user._id}`,
        { withCredentials: true }
      );

      toast.success(res.data?.message || "Chat deleted");
      await refreshChats();

      if (String(selectedChat?._id) === String(user._id)) {
        setSelectedChat(null);
        setChatMessages([]);
      }
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to delete chat";
      setError(message);
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!currentUser?._id) {
    return (
      <div className={pageBackground}>
        <div className={pageWrapper}>
          <div className={cardClass}>
            <h1 className={pageTitleClass}>Messages</h1>
            <p className={`${bodyText} mt-4`}>
              Sign in to view and send direct messages.
            </p>
          </div>
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
              Messages
            </p>
            <h1 className={pageTitleClass}>Direct messages and conversation history.</h1>
            
          </div>

          {error ? <div className={errorClass}>{error}</div> : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <ChatList
              chats={chats}
              selectedChatId={selectedChat?._id}
              searchQuery={chatSearchQuery}
              setSearchQuery={setChatSearchQuery}
              searchResults={chatSearchMatches}
              searchLoading={searching}
              onSelectUser={handleSelectUser}
              onDeleteChat={handleDeleteChat}
            />

            <ChatWindow
              currentUser={currentUser}
              selectedChat={selectedChat}
              messages={chatMessages}
              loading={historyLoading || chatsLoading}
              sending={sending}
              error={error}
              draft={draft}
              setDraft={setDraft}
              onSend={handleSend}
              onDeleteChat={handleDeleteChat}
              deleteLoading={deleteLoading}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default Messages;