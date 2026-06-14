import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  bodyText,
  mutedText,
  primaryBtn,
  secondaryBtn,
  emptyStateClass,
} from "../styles/common";

const getInitial = (value) => value?.trim()?.charAt(0)?.toUpperCase() || "U";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileRes, dashboardRes] = await Promise.all([
          axios.get("http://localhost:3000/user-api/me", { withCredentials: true }),
          axios.get("http://localhost:3000/user-api/dashboard", { withCredentials: true }),
        ]);

        setProfile(profileRes.data?.user || null);
        setSummary(dashboardRes.data?.summary || null);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <div className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className={pageTitleClass}>Profile</h1>
            </div>
            <Link to="/edit-profile" className={primaryBtn}>
              Edit Profile
            </Link>
          </div>

          {error ? (
            <div className={emptyStateClass}>{error}</div>
          ) : loading ? (
            <div className={emptyStateClass}>Loading profile...</div>
          ) : profile ? (
            <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-3xl border border-[#1f1f1f] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#11A8E8] uppercase tracking-[0.3em] font-bold">Account</p>
                    <h2 className="text-2xl font-bold mt-3">{profile.username}</h2>
                    <p className={`${mutedText} mt-2`}>{profile.email}</p>
                  </div>

                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.username || profile.email || "User avatar"}
                      className="h-20 w-20 rounded-full object-cover border border-[#1f1f1f]"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-[#0f172a] text-[#11A8E8] flex items-center justify-center font-bold border border-[#1f1f1f]">
                      {getInitial(profile.username || profile.email)}
                    </div>
                  )}
                </div>
                <p className={`${bodyText} mt-5`}>{profile.bio || "No bio added yet."}</p>

                <div className="mt-6 flex gap-3">
                  <Link to="/my-posts" className={secondaryBtn}>
                    My Posts
                  </Link>
                  <Link to="/saved-posts" className={secondaryBtn}>
                    Saved Posts
                  </Link>
                  <Link to="/mood-journal" className={secondaryBtn}>
                    Mood Journal
                  </Link>
                  <Link to="/change-password" className={secondaryBtn}>
                    Change Password
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-[#1f1f1f] p-5 space-y-4">
                <div>
                  <p className="text-sm text-[#737373]">Posts</p>
                  <p className="text-2xl font-bold">{summary?.myPosts || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-[#737373]">Saved</p>
                  <p className="text-2xl font-bold">{summary?.savedPosts || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-[#737373]">Unread notifications</p>
                  <p className="text-2xl font-bold">{summary?.unreadNotifications || 0}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={emptyStateClass}>No profile information available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
