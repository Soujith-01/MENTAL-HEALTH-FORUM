import { secondaryBtn, mutedText } from "../styles/common";

function AdminUsersPanel({ users = [], saving = false, onToggleRole, onToggleStatus }) {
  return (
    <div className="rounded-3xl border border-[#1f1f1f] bg-[#0b0b0b] p-5">
      <p className="text-sm font-semibold text-white">Users</p>

      {users.length ? (
        <div className="mt-4 flex flex-col gap-3">
          {users.map((user) => (
            <div key={user._id} className="rounded-2xl border border-[#1f1f1f] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{user.username}</p>
                  <p className={mutedText}>{user.email}</p>
                </div>
                <span className={mutedText}>{user.role}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onToggleRole?.(user._id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                  className={secondaryBtn}
                  disabled={saving}
                >
                  {user.role === "ADMIN" ? "Demote" : "Promote"}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStatus?.(user._id, !user.isUserActive)}
                  className={secondaryBtn}
                  disabled={saving}
                >
                  {user.isUserActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 text-sm text-[#666666]">No users loaded.</div>
      )}
    </div>
  );
}

export default AdminUsersPanel;