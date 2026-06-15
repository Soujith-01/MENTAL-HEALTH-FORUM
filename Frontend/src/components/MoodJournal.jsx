import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from "react-router";
import { useAuthStore } from "../store/authStore";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  pageTitleClass,
  bodyText,
  mutedText,
  inputClass,
  labelClass,
  formGroup,
  submitBtn,
  secondaryBtn,
  errorClass,
  emptyStateClass,
} from "../styles/common";

const moodOptions = ["happy", "calm", "neutral", "sad", "stressed"];

function MoodJournal() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [moods, setMoods] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedMood, setSelectedMood] = useState(moodOptions[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser?._id) {
      setLoading(false);
      return;
    }

    const loadMoodData = async () => {
      setLoading(true);
      setError("");

      try {
        const [moodsRes, statsRes] = await Promise.all([
          axios.get("/user-api/me/moods", { withCredentials: true }),
          axios.get("/user-api/moods/stats", { withCredentials: true }),
        ]);

        setMoods(Array.isArray(moodsRes.data?.moods) ? moodsRes.data.moods : []);
        setStats(statsRes.data?.stats || {});
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load mood journal");
      } finally {
        setLoading(false);
      }
    };

    loadMoodData();
  }, [currentUser?._id]);

  const refreshMoodData = async () => {
    const [moodsRes, statsRes] = await Promise.all([
      axios.get("/user-api/me/moods", { withCredentials: true }),
      axios.get("/user-api/moods/stats", { withCredentials: true }),
    ]);

    setMoods(Array.isArray(moodsRes.data?.moods) ? moodsRes.data.moods : []);
    setStats(statsRes.data?.stats || {});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?._id) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await axios.post(
        "/user-api/moods",
        { mood: selectedMood, note: note.trim() },
        { withCredentials: true }
      );

      setNote("");
      await refreshMoodData();
      toast.success("Mood entry added");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to save mood";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser?._id) {
    return (
      <div className={pageBackground}>
        <div className={pageWrapper}>
          <div className={cardClass}>
            <h1 className={pageTitleClass}>Mood Journal</h1>
            
            <div className="mt-6 flex gap-3">
              <Link to="/login" className={secondaryBtn}>
                Sign In
              </Link>
              <Link to="/register" className={secondaryBtn}>
                Create Account
              </Link>
            </div>
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
              Mood Journal
            </p>
            <h1 className={pageTitleClass}>Track your daily mood history.</h1>
           
          </div>

          {error ? <div className={errorClass}>{error}</div> : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-5">
              <div className={formGroup}>
                <label className={labelClass}>How are you feeling?</label>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setSelectedMood(mood)}
                      className={`${secondaryBtn} capitalize ${selectedMood === mood ? "border-[#11A8E8]" : ""}`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div className={formGroup}>
                <label className={labelClass}>Note</label>
                <textarea
                  rows="5"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Write down what influenced this mood today"
                  className={`${inputClass} resize-y`}
                />
              </div>

              <button type="submit" disabled={saving} className={submitBtn}>
                {saving ? "Saving..." : "Save Mood"}
              </button>
            </form>

            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {moodOptions.map((mood) => (
                  <div key={mood} className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#737373]">{mood}</p>
                    <p className="mt-2 text-3xl font-black text-white">{stats?.[mood] || 0}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-5">
                <p className="text-sm font-semibold text-white">Recent entries</p>
                {moods.length ? (
                  <div className="mt-4 flex flex-col gap-3">
                    {moods.slice(0, 8).map((entry) => (
                      <div key={entry._id || `${entry.mood}-${entry.createdAt}`} className="rounded-2xl border border-[#1f1f1f] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold capitalize text-white">{entry.mood}</p>
                          <span className={mutedText}>
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                          </span>
                        </div>
                        {entry.note ? <p className={`${bodyText} mt-2`}>{entry.note}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={emptyStateClass}>No mood entries yet.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default MoodJournal;

