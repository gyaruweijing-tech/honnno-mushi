import Dexie, { type EntityTable } from 'dexie';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  status: 'unread' | 'read';
  starred: boolean;
  memo: string;
  createdAt: number;
  updatedAt: number;
}

const db = new Dexie('HonnnoMushiDB') as Dexie & {
  bookmarks: EntityTable<Bookmark, 'id'>;
};

db.version(1).stores({
  bookmarks: 'id, url, status, starred, *tags, createdAt',
});

export { db };
