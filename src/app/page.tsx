'use client';

import { useState } from 'react';
import { useBookmarks } from '@/hooks/useBookmarks';
import BookmarkCard from '@/components/BookmarkCard/BookmarkCard';
import AddBookmarkModal from '@/components/AddBookmarkModal/AddBookmarkModal';
import BookmarkDetail from '@/components/BookmarkDetail/BookmarkDetail';
import FilterBar from '@/components/FilterBar/FilterBar';
import { type Bookmark } from '@/lib/db';
import styles from './page.module.css';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [starredOnly, setStarredOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const {
    bookmarks,
    allTags,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleStar,
    toggleStatus,
  } = useBookmarks({ searchQuery, statusFilter, tagFilter, starredOnly });

  const handleSave = async (data: {
    url: string;
    title: string;
    description: string;
    thumbnail: string;
    tags: string[];
    memo: string;
  }) => {
    await addBookmark({
      ...data,
      status: 'unread',
      starred: false,
    });
  };

  const handleCardClick = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setShowDetail(true);
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setSelectedBookmark(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1 className={styles.appTitle}>honnno-mushi</h1>
          <span className={styles.emoji}>🐛</span>
        </div>
        <p className={styles.subtitle}>あなたのリーディングリスト</p>
      </header>

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        starredOnly={starredOnly}
        onStarredChange={setStarredOnly}
        tagFilter={tagFilter}
        onTagChange={setTagFilter}
        allTags={allTags}
      />

      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <>
          {bookmarks.length > 0 && (
            <p className={styles.count}>{bookmarks.length} 件</p>
          )}
          <div className={styles.grid}>
            {bookmarks.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyEmoji}>📚</span>
                <h2 className={styles.emptyTitle}>
                  {searchQuery || statusFilter !== 'all' || starredOnly || tagFilter
                    ? '条件に一致するブックマークがありません'
                    : 'まだブックマークがありません'}
                </h2>
                <p className={styles.emptyText}>
                  {searchQuery || statusFilter !== 'all' || starredOnly || tagFilter
                    ? 'フィルターを変更してみてください'
                    : '右下の + ボタンからURLを追加してみましょう！'}
                </p>
              </div>
            ) : (
              bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onToggleStar={toggleStar}
                  onToggleStatus={toggleStatus}
                  onClick={handleCardClick}
                />
              ))
            )}
          </div>
        </>
      )}

      <button
        className={styles.fab}
        onClick={() => setShowAddModal(true)}
        aria-label="ブックマークを追加"
      >
        +
      </button>

      <AddBookmarkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSave}
      />

      <BookmarkDetail
        bookmark={selectedBookmark}
        isOpen={showDetail}
        onClose={handleDetailClose}
        onUpdate={updateBookmark}
        onDelete={deleteBookmark}
        onToggleStar={toggleStar}
        onToggleStatus={toggleStatus}
      />
    </div>
  );
}
