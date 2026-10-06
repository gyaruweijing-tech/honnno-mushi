'use client';

import { type Bookmark } from '@/lib/db';
import styles from './BookmarkCard.module.css';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onToggleStar: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onClick: (bookmark: Bookmark) => void;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}

export default function BookmarkCard({
  bookmark,
  onToggleStar,
  onToggleStatus,
  onClick,
}: BookmarkCardProps) {
  return (
    <article
      className={styles.card}
      onClick={() => onClick(bookmark)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(bookmark)}
    >
      <div className={styles.thumbnailWrap}>
        {bookmark.thumbnail ? (
          <img
            src={bookmark.thumbnail}
            alt=""
            className={styles.thumbnail}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.classList.add(styles.noImage);
            }}
          />
        ) : (
          <div className={`${styles.thumbnailWrap} ${styles.noImage}`}>
            <span className={styles.placeholderIcon}>📄</span>
          </div>
        )}
        <button
          className={`${styles.starBtn} ${bookmark.starred ? styles.starActive : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(bookmark.id);
          }}
          aria-label={bookmark.starred ? 'お気に入り解除' : 'お気に入りに追加'}
        >
          {bookmark.starred ? '★' : '☆'}
        </button>
        <span
          className={`${styles.statusBadge} ${
            bookmark.status === 'unread' ? styles.unread : styles.read
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(bookmark.id);
          }}
        >
          {bookmark.status === 'unread' ? '未読' : '読了'}
        </span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{bookmark.title || bookmark.url}</h3>
        <p className={styles.domain}>{getDomain(bookmark.url)}</p>

        {bookmark.tags.length > 0 && (
          <div className={styles.tags}>
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className={styles.tagMore}>+{bookmark.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.date}>{formatDate(bookmark.createdAt)}</span>
          <button
            className={styles.openBtn}
            onClick={(e) => {
              e.stopPropagation();
              window.open(bookmark.url, '_blank', 'noopener,noreferrer');
            }}
            aria-label="URLを開く"
          >
            ↗
          </button>
        </div>
      </div>
    </article>
  );
}
