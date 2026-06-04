import { getDb } from "./db";
import type { LiveAlbum } from "./types";

export function getLiveAlbums(options?: { enabledOnly?: boolean }) {
  const where = options?.enabledOnly ? "WHERE enabled = 1 AND live_url IS NOT NULL AND live_url != ''" : "";
  return getDb()
    .prepare(`SELECT * FROM live_albums ${where} ORDER BY sort_order ASC, created_at DESC`)
    .all() as LiveAlbum[];
}

export function getLiveAlbum(id: number) {
  return getDb().prepare("SELECT * FROM live_albums WHERE id = ?").get(id) as LiveAlbum | undefined;
}

export function createLiveAlbum(input: {
  title: string;
  description?: string;
  liveUrl?: string;
  coverPath?: string | null;
  enabled?: boolean;
  sortOrder?: number;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO live_albums (title, description, live_url, cover_path, enabled, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.description ?? null,
      input.liveUrl ?? null,
      input.coverPath ?? null,
      input.enabled ? 1 : 0,
      input.sortOrder ?? 0,
    );

  return Number(result.lastInsertRowid);
}

export function updateLiveAlbum(
  id: number,
  input: {
    title: string;
    description?: string;
    liveUrl?: string;
    coverPath?: string | null;
    enabled?: boolean;
    sortOrder?: number;
  },
) {
  getDb()
    .prepare(
      `UPDATE live_albums
       SET title = ?, description = ?, live_url = ?, cover_path = COALESCE(?, cover_path),
           enabled = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .run(
      input.title,
      input.description ?? null,
      input.liveUrl ?? null,
      input.coverPath ?? null,
      input.enabled ? 1 : 0,
      input.sortOrder ?? 0,
      id,
    );
}

export function deleteLiveAlbum(id: number) {
  const album = getLiveAlbum(id);
  getDb().prepare("DELETE FROM live_albums WHERE id = ?").run(id);
  return album;
}
