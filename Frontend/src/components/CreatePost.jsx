import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import {
  pageBackground,
  pageWrapper,
  cardClass,
  formGroup,
  labelClass,
  inputClass,
  submitBtn,
  errorClass,
  pageTitleClass,
  mutedText,
} from "../styles/common";

function CreatePost() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [categories, setCategories] = useState([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get("/user-api/categories");
        setCategories(res.data?.categories || []);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const formData = new FormData(event.currentTarget);

    try {
      const res = await axios.post("/user-api/posts", formData, {
        withCredentials: true,
      });

      toast.success(res.data?.message || "Post created");
      event.currentTarget.reset();
      const createdPostId = res.data?.post?._id;
      if (createdPostId) {
        navigate(`/posts/${createdPostId}`);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Unable to create post";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <div className={cardClass}>
          <h1 className={pageTitleClass}>Create Post</h1>

          {formError && <p className={`${errorClass} mt-6`}>{formError}</p>}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className={formGroup}>
              <label className={labelClass}>Content</label>
              <textarea
                name="content"
                rows="8"
                required
                className={`${inputClass} resize-y min-h-50`}
                placeholder="Share what you are feeling or thinking..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={formGroup}>
                <label className={labelClass}>Category</label>
                <select name="category" required className={inputClass} defaultValue="">
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className={formGroup}>
                <label className={labelClass}>Tags</label>
                <input
                  type="text"
                  name="tags"
                  className={inputClass}
                  placeholder="comma,separated,tags"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                <input type="checkbox" name="isAnonymous" className="h-4 w-4" />
                Post anonymously
              </label>

              <div>
                <label className={labelClass}>Image</label>
                <input type="file" name="image" accept="image/*" className={inputClass} />
              </div>
            </div>

            <button type="submit" disabled={saving} className={submitBtn}>
              {saving ? "Posting..." : "Publish Post"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;


