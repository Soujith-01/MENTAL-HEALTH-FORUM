import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "react-router";
import {
  pageBackground,
  pageWrapper,
  formCard,
  formTitle,
  formGroup,
  labelClass,
  inputClass,
  submitBtn,
  errorClass,
  bodyText,
  secondaryBtn,
} from "../styles/common";

function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    setSaving(true);

    try {
      const res = await axios.put(
        "http://localhost:3000/common-api/password",
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        { withCredentials: true }
      );

      toast.success(res.data?.message || "Password updated");
      navigate("/profile");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to change password";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <div className={formCard}>
          <h1 className={formTitle}>Change Password</h1>
          <p className={`${bodyText} text-center mb-6`}>
            This page uses the backend password route for account security.
          </p>

          {error ? <p className={errorClass}>{error}</p> : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={formGroup}>
              <label className={labelClass}>Current Password</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div className={formGroup}>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div className={formGroup}>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className={inputClass}
              />
            </div>

            <button type="submit" disabled={saving} className={submitBtn}>
              {saving ? "Saving..." : "Update Password"}
            </button>
          </form>

          <div className="mt-6 flex justify-center">
            <Link to="/profile" className={secondaryBtn}>
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;