import { v4 as uuidv4 } from 'uuid';
import { db, type Bookmark } from './db';

export async function addBookmark(
  data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Bookmark> {
  const now = Date.now();
  const bookmark: Bookmark = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  await db.bookmarks.add(bookmark);
  return bookmark;
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  return db.bookmarks.orderBy('createdAt').reverse().toArray();
}

export async function updateBookmark(
  id: string,
  updates: Partial<Bookmark>
): Promise<void> {
  await db.bookmarks.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteBookmark(id: string): Promise<void> {
  await db.bookmarks.delete(id);
}

export async function toggleStar(id: string): Promise<void> {
  const bookmark = await db.bookmarks.get(id);
  if (bookmark) {
    await db.bookmarks.update(id, {
      starred: !bookmark.starred,
      updatedAt: Date.now(),
    });
  }
}

export async function toggleStatus(id: string): Promise<void> {
  const bookmark = await db.bookmarks.get(id);
  if (bookmark) {
    await db.bookmarks.update(id, {
      status: bookmark.status === 'unread' ? 'read' : 'unread',
      updatedAt: Date.now(),
    });
  }
}
