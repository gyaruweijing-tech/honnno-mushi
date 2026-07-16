'use client';

import { useState, useCallback } from 'react';
import styles from './AddBookmarkModal.module.css';

interface OgpData {
  title: string;
  description: string;
  image: string;
}

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    url: string;
    title: string;
    description: string;
    thumbnail: string;
    tags: string[];
    memo: string;
  }) => void;
}

export default function AddBookmarkModal({
  isOpen,
  onClose,
  onSave,
}: AddBookmarkModalProps) {
  const [url, setUrl] = useState('');
  const [ogp, setOgp] = useState<OgpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [titleOverride, setTitleOverride] = useState('');

  const fetchOgp = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/ogp?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) throw new Error('OGP取得に失敗しました');
      const data: OgpData = await res.json();
      setOgp(data);
      setTitleOverride(data.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setOgp(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value.match(/^https?:\/\/.+\..+/)) {
      fetchOgp(value);
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.match(/^https?:\/\/.+\..+/)) {
      setTimeout(() => fetchOgp(pasted), 100);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '');
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!url.trim()) return;
    onSave({
      url: url.trim(),
      title: titleOverride || ogp?.title || url,
      description: ogp?.description || '',
      thumbnail: ogp?.image || '',
      tags,
      memo,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setUrl('');
    setOgp(null);
    setError('');
    setTagInput('');
    setTags([]);
    setMemo('');
    setTitleOverride('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>🔗 URLを追加</h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>URL</label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onPaste={handleUrlPaste}
              autoFocus
            />
          </div>

          {loading && (
            <div className={styles.loadingWrap}>
              <div className={styles.spinner} />
              <span>ページ情報を取得中...</span>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          {ogp && !loading && (
            <div className={styles.preview}>
              {ogp.image && (
                <img
                  src={ogp.image}
                  alt=""
                  className={styles.previewImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className={styles.previewInfo}>
                <input
                  type="text"
                  className={styles.titleInput}
                  value={titleOverride}
                  onChange={(e) => setTitleOverride(e.target.value)}
                  placeholder="タイトル"
                />
                {ogp.description && (
                  <p className={styles.previewDesc}>{ogp.description}</p>
                )}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>タグ</label>
            <div className={styles.tagInputWrap}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  #{tag}
                  <button
                    className={styles.tagRemove}
                    onClick={() => removeTag(tag)}
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={styles.tagInput}
                placeholder={tags.length === 0 ? 'タグを入力してEnter' : ''}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>メモ（任意）</label>
            <textarea
              className={styles.textarea}
              placeholder="あとで読む理由など..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={handleClose}>
            キャンセル
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!url.trim()}
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
