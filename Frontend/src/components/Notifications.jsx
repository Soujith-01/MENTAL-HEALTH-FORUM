import { useEffect, useState } from "react";
import axios from "axios";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  commentCard,
  commentHeader,
  commentUser,
  commentTime,
  commentText,
  emptyStateClass,
  secondaryBtn,
} from "../styles/common";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      const res = await axios.get("/user-api/notifications", {
        withCredentials: true,
      });

      setNotifications(res.data?.notifications || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleClear = async () => {
    try {
      await axios.delete("/user-api/notifications", {
        withCredentials: true,
      });
      setNotifications([]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to clear notifications");
    }
  };

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <div className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className={pageTitleClass}>Notifications</h1>
            <button type="button" onClick={handleClear} className={secondaryBtn}>
              Clear All
            </button>
          </div>

          {error ? (
            <div className={emptyStateClass}>{error}</div>
          ) : loading ? (
            <div className={emptyStateClass}>Loading notifications...</div>
          ) : notifications.length ? (
            <div className="mt-6 flex flex-col gap-4">
              {notifications.map((notification) => (
                <div key={notification._id} className={commentCard}>
                  <div className={commentHeader}>
                    <span className={commentUser}>{notification.type || "Update"}</span>
                    <span className={commentTime}>
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className={commentText}>{notification.message || "New notification"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={emptyStateClass}>No notifications right now.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;


