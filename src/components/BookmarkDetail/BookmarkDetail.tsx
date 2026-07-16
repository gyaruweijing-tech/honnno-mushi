'use client';

import { useState } from 'react';
import { type Bookmark } from '@/lib/db';
import styles from './BookmarkDetail.module.css';

interface BookmarkDetailProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Bookmark>) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleStatus: (id: string) => void;
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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BookmarkDetail({
  bookmark,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onToggleStar,
  onToggleStatus,
}: BookmarkDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !bookmark) return null;

  const startEdit = () => {
    setEditTitle(bookmark.title);
    setEditMemo(bookmark.memo);
    setEditTags([...bookmark.tags]);
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate(bookmark.id, {
      title: editTitle,
      memo: editMemo,
      tags: editTags,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = editTagInput.trim().replace(/^#/, '');
      if (tag && !editTags.includes(tag)) {
        setEditTags([...editTags, tag]);
      }
      setEditTagInput('');
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(bookmark.id);
      setConfirmDelete(false);
      onClose();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleClose = () => {
    setEditing(false);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {bookmark.thumbnail && (
          <div className={styles.thumbnailWrap}>
            <img
              src={bookmark.thumbnail}
              alt=""
              className={styles.thumbnail}
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className={styles.body}>
          <div className={styles.topActions}>
            <span
              className={`${styles.statusBadge} ${
                bookmark.status === 'unread' ? styles.unread : styles.read
              }`}
              onClick={() => onToggleStatus(bookmark.id)}
            >
              {bookmark.status === 'unread' ? '📖 未読' : '✅ 読了'}
            </span>
            <div className={styles.topRight}>
              <button
                className={`${styles.starBtn} ${bookmark.starred ? styles.starActive : ''}`}
                onClick={() => onToggleStar(bookmark.id)}
              >
                {bookmark.starred ? '★' : '☆'}
              </button>
              <button className={styles.closeBtn} onClick={handleClose}>
                ✕
              </button>
            </div>
          </div>

          {editing ? (
            <>
              <input
                type="text"
                className={styles.editInput}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.url}
              >
                {getDomain(bookmark.url)}
              </a>

              <div className={styles.editTagWrap}>
                {editTags.map((tag) => (
                  <span key={tag} className={styles.tagChip}>
                    #{tag}
                    <button
                      className={styles.tagRemove}
                      onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className={styles.tagInput}
                  placeholder="タグを追加..."
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
              </div>

              <textarea
                className={styles.editTextarea}
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                placeholder="メモ..."
                rows={4}
              />

              <div className={styles.editActions}>
                <button className={styles.cancelBtn} onClick={cancelEdit}>
                  キャンセル
                </button>
                <button className={styles.saveBtn} onClick={saveEdit}>
                  保存
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className={styles.title}>{bookmark.title || bookmark.url}</h2>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.url}
              >
                🔗 {getDomain(bookmark.url)}
              </a>

              {bookmark.description && (
                <p className={styles.description}>{bookmark.description}</p>
              )}

              {bookmark.tags.length > 0 && (
                <div className={styles.tags}>
                  {bookmark.tags.map((tag) => (
                    <span key={tag} className={styles.tagChipView}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {bookmark.memo && (
                <div className={styles.memoSection}>
                  <h4 className={styles.memoLabel}>📝 メモ</h4>
                  <p className={styles.memo}>{bookmark.memo}</p>
                </div>
              )}

              <div className={styles.dates}>
                <span>追加: {formatDate(bookmark.createdAt)}</span>
                {bookmark.updatedAt !== bookmark.createdAt && (
                  <span>更新: {formatDate(bookmark.updatedAt)}</span>
                )}
              </div>
            </>
          )}
        </div>

        {!editing && (
          <div className={styles.footer}>
            <button
              className={styles.deleteBtn}
              onClick={handleDelete}
            >
              {confirmDelete ? '本当に削除する？' : '🗑️ 削除'}
            </button>
            <div className={styles.footerRight}>
              <button className={styles.editBtn} onClick={startEdit}>
                ✏️ 編集
              </button>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openBtn}
              >
                📖 記事を読む
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
