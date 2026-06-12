import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAuthToken } from "@/lib/api";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  role: string | null;
  setSession: (s: {
    accessToken: string;
    refreshToken: string;
    email: string;
    role: string;
  }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      email: null,
      role: null,
      setSession: ({ accessToken, refreshToken, email, role }) => {
        setAuthToken(accessToken);
        set({ accessToken, refreshToken, email, role });
      },
      clear: () => {
        setAuthToken(null);
        set({
          accessToken: null,
          refreshToken: null,
          email: null,
          role: null,
        });
      },
    }),
    {
      name: "thf-auth",
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        email: s.email,
        role: s.role,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAuthToken(state.accessToken);
      },
    },
  ),
);
