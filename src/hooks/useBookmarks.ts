'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, type Bookmark } from '@/lib/db';
import * as bookmarkOps from '@/lib/bookmarks';

interface UseBookmarksOptions {
  searchQuery?: string;
  statusFilter?: 'all' | 'unread' | 'read';
  tagFilter?: string;
  starredOnly?: boolean;
}

export function useBookmarks(options: UseBookmarksOptions = {}) {
  const { searchQuery = '', statusFilter = 'all', tagFilter = '', starredOnly = false } = options;
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await bookmarkOps.getAllBookmarks();
      setAllBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredBookmarks = useMemo(() => {
    let result = allBookmarks;

    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    if (starredOnly) {
      result = result.filter((b) => b.starred);
    }

    if (tagFilter) {
      result = result.filter((b) => b.tags.includes(tagFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.memo.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allBookmarks, statusFilter, starredOnly, tagFilter, searchQuery]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allBookmarks.forEach((b) => b.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [allBookmarks]);

  const addBookmark = useCallback(
    async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
      await bookmarkOps.addBookmark(data);
      await refresh();
    },
    [refresh]
  );

  const updateBookmark = useCallback(
    async (id: string, updates: Partial<Bookmark>) => {
      await bookmarkOps.updateBookmark(id, updates);
      await refresh();
    },
    [refresh]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      await bookmarkOps.deleteBookmark(id);
      await refresh();
    },
    [refresh]
  );

  const toggleStar = useCallback(
    async (id: string) => {
      await bookmarkOps.toggleStar(id);
      await refresh();
    },
    [refresh]
  );

  const toggleStatus = useCallback(
    async (id: string) => {
      await bookmarkOps.toggleStatus(id);
      await refresh();
    },
    [refresh]
  );

  return {
    bookmarks: filteredBookmarks,
    allBookmarks,
    allTags,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleStar,
    toggleStatus,
    refresh,
  };
}
