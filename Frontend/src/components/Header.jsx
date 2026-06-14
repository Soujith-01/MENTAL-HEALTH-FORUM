import axios from "axios";
import { NavLink, useNavigate } from "react-router";
import { useAuthStore } from "../store/authStore";
import {
  navbarClass,
  navContainerClass,
  navBrandClass,
  navLinksClass,
  navLinkClass,
  navLinkActiveClass,
  primaryBtn,
  secondaryBtn,
} from "../styles/common";

function Header() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const clearCurrentUser = useAuthStore((state) => state.clearCurrentUser);
  const navigate = useNavigate();

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/discover", label: "Discover" },
    { to: "/notifications", label: "Notifications" },
    { to: "/messages", label: "Messages" },
    { to: "/mood-journal", label: "Mood Journal" },
  ];

  const visibleNavItems = currentUser
    ? currentUser.role === "ADMIN"
      ? [...navItems, { to: "/create-post", label: "Create Post" }, { to: "/admin", label: "Admin" }]
      : [...navItems, { to: "/create-post", label: "Create Post" }]
    : navItems;

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:3000/common-api/logout", {
        withCredentials: true,
      });
    } catch {
      // Ignore logout errors and clear local session anyway.
    }

    clearCurrentUser();
    navigate("/login");
  };

  return (
    <header className={navbarClass}>
      <div className={navContainerClass}>
        <NavLink to="/" className={navBrandClass}>
          Mental Health Forum
        </NavLink>

        <nav className={navLinksClass}>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? navLinkActiveClass : navLinkClass)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <NavLink to="/profile" aria-label="Open profile">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username || currentUser.email || "User avatar"}
                  className="h-10 w-10 rounded-full object-cover border border-white/10"
                />
              </NavLink>
              <button type="button" onClick={handleLogout} className={secondaryBtn}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className={secondaryBtn}>
                Login
              </NavLink>
              <NavLink to="/register" className={primaryBtn}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
