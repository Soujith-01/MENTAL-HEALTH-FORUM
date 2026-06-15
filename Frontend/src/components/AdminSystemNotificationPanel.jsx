import { formGroup, inputClass, labelClass, submitBtn } from "../styles/common";

function AdminSystemNotificationPanel({ value, onChange, onSubmit, saving = false }) {
  return (
    <div className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-5">
      <p className="text-sm font-semibold text-white">Broadcast message</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className={formGroup}>
          <label className={labelClass}>System Notification</label>
          <textarea
            rows="4"
            value={value}
            onChange={onChange}
            className={`${inputClass} resize-y`}
            placeholder="Send a message to all active users"
          />
        </div>
        <button type="submit" disabled={saving} className={submitBtn}>
          {saving ? "Sending..." : "Send Notification"}
        </button>
      </form>
    </div>
  );
}

export default AdminSystemNotificationPanel;
