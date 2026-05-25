"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookmarksState {
  bookmarks: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
}

export const useBookmarks = create<BookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      toggle: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((b) => b !== id)
            : [...s.bookmarks, id],
        })),
      has: (id) => get().bookmarks.includes(id),
      clear: () => set({ bookmarks: [] }),
    }),
    { name: "mercury-skills-bookmarks" }
  )
);
