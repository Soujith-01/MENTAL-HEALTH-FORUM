import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  formGroup,
  labelClass,
  inputClass,
  submitBtn,
  errorClass,
  mutedText,
} from "../styles/common";

const avatarOptions = [
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=BlueCircle",
  "https://api.dicebear.com/9.x/big-ears/svg?seed=CalmFace",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=SoftSmile",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=NeonMood",
];

function EditProfile() {
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const [profile, setProfile] = useState({ username: "", bio: "", avatar: avatarOptions[0] });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axios.get("/user-api/me", {
          withCredentials: true,
        });

        setProfile({
          username: res.data?.user?.username || "",
          bio: res.data?.user?.bio || "",
          avatar: res.data?.user?.avatar || avatarOptions[0],
        });
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleTextSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await axios.patch(
        "/user-api/me",
        {
          username: profile.username,
          bio: profile.bio,
          avatar: profile.avatar,
        },
        { withCredentials: true }
      );

      const updatedUser = res.data?.user || null;
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }

      toast.success(res.data?.message || "Profile updated");
      navigate("/profile");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to update profile";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={`${pageBackground} ${mutedText} p-10`}>Loading profile...</div>;
  }

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <div className={cardClass}>
          <h1 className={pageTitleClass}>Edit Profile</h1>

          {error && <p className={errorClass}>{error}</p>}

          <form className="mt-6 space-y-5" onSubmit={handleTextSave}>
            <div className={formGroup}>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(event) => setProfile((current) => ({ ...current, username: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div className={formGroup}>
              <label className={labelClass}>Bio</label>
              <textarea
                rows="6"
                value={profile.bio}
                onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
                className={`${inputClass} resize-y`}
                placeholder="Tell people a little about yourself"
              />
            </div>

            <div className={formGroup}>
              <label className={labelClass}>Choose Avatar</label>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {avatarOptions.map((avatarUrl) => (
                  <button
                    key={avatarUrl}
                    type="button"
                    onClick={() => setProfile((current) => ({ ...current, avatar: avatarUrl }))}
                    className={`rounded-3xl border p-3 transition-all duration-300 ${
                      profile.avatar === avatarUrl
                        ? "border-[#11A8E8] bg-[#0b1720]"
                        : "border-[#1f1f1f] bg-[#0d0d0d] hover:border-[#11A8E8]/40"
                    }`}
                  >
                    <img
                      src={avatarUrl}
                      alt="Avatar option"
                      className="h-20 w-20 rounded-full object-cover border border-[#1f1f1f]"
                    />
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving} className={submitBtn}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;


