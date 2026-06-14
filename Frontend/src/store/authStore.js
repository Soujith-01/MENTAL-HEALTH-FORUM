import { create } from "zustand";

const STORAGE_KEY = "mhf-user";

const readStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

const writeStoredUser = (user) => {
  if (typeof window === "undefined") {
    return;
  }

  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(new Event("mhf-auth-changed"));
};

export const useAuthStore = create((set, get) => ({
  currentUser: readStoredUser(),
  setCurrentUser: (user) => {
    writeStoredUser(user);
    set({ currentUser: user });
  },
  clearCurrentUser: () => {
    writeStoredUser(null);
    set({ currentUser: null });
  },
  syncCurrentUser: () => {
    set({ currentUser: readStoredUser() });
  },
  hasCurrentUser: () => Boolean(get().currentUser),
}));

if (typeof window !== "undefined" && !window.__mhfAuthStoreSynced) {
  window.__mhfAuthStoreSynced = true;

  const syncCurrentUser = () => useAuthStore.getState().syncCurrentUser();

  window.addEventListener("storage", syncCurrentUser);
  window.addEventListener("mhf-auth-changed", syncCurrentUser);
}