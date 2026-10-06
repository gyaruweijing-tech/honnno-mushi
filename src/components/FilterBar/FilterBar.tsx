'use client';

import styles from './FilterBar.module.css';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'unread' | 'read';
  onStatusChange: (status: 'all' | 'unread' | 'read') => void;
  starredOnly: boolean;
  onStarredChange: (starred: boolean) => void;
  tagFilter: string;
  onTagChange: (tag: string) => void;
  allTags: string[];
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  starredOnly,
  onStarredChange,
  tagFilter,
  onTagChange,
  allTags,
}: FilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="タイトル、URL、メモで検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            className={styles.clearBtn}
            onClick={() => onSearchChange('')}
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.filters}>
        <div className={styles.statusGroup}>
          {(['all', 'unread', 'read'] as const).map((status) => (
            <button
              key={status}
              className={`${styles.statusBtn} ${
                statusFilter === status ? styles.statusActive : ''
              }`}
              onClick={() => onStatusChange(status)}
            >
              {status === 'all' ? 'すべて' : status === 'unread' ? '未読' : '読了'}
            </button>
          ))}
        </div>

        <button
          className={`${styles.starFilter} ${starredOnly ? styles.starFilterActive : ''}`}
          onClick={() => onStarredChange(!starredOnly)}
        >
          {starredOnly ? '★' : '☆'}
        </button>

        {allTags.length > 0 && (
          <div className={styles.tagFilter}>
            <select
              className={styles.tagSelect}
              value={tagFilter}
              onChange={(e) => onTagChange(e.target.value)}
            >
              <option value="">🏷️ すべてのタグ</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
