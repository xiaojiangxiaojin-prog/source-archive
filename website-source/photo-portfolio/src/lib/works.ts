import { getDb } from "./db";
import { visibleCategorySlugs } from "./constants";
import type { Category, Work } from "./types";

const workSelect = `
  SELECT works.*, categories.name AS category_name, categories.slug AS category_slug
  FROM works
  JOIN categories ON categories.id = works.category_id
`;

export function getCategories() {
  const placeholders = visibleCategorySlugs.map(() => "?").join(",");
  return getDb()
    .prepare(`SELECT * FROM categories WHERE slug IN (${placeholders}) ORDER BY sort_order ASC, id ASC`)
    .all(...visibleCategorySlugs) as Category[];
}

export function getWorks(options?: {
  featured?: boolean;
  categorySlug?: string;
  limit?: number;
  excludeVideos?: boolean;
}) {
  const filters: string[] = [`categories.slug IN (${visibleCategorySlugs.map(() => "?").join(",")})`];
  const params: (string | number)[] = [...visibleCategorySlugs];

  if (options?.featured) {
    filters.push("works.is_featured = 1");
  }
  if (options?.excludeVideos) {
    filters.push("works.type <> 'video'");
  }
  if (options?.categorySlug) {
    if (!visibleCategorySlugs.includes(options.categorySlug as (typeof visibleCategorySlugs)[number])) {
      return [];
    }
    filters.push("categories.slug = ?");
    params.push(options.categorySlug);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const limit = options?.limit ? "LIMIT ?" : "";
  if (options?.limit) params.push(options.limit);

  return getDb()
    .prepare(`${workSelect} ${where} ORDER BY works.sort_order ASC, works.created_at DESC ${limit}`)
    .all(...params) as Work[];
}

export function getWork(id: number) {
  return getDb()
    .prepare(
      `${workSelect} WHERE works.id = ? AND categories.slug IN (${visibleCategorySlugs.map(() => "?").join(",")})`,
    )
    .get(id, ...visibleCategorySlugs) as Work | undefined;
}

export function createWork(input: {
  title: string;
  description?: string;
  type: "image" | "video";
  categoryId: number;
  originalPath: string;
  compressedPath?: string | null;
  thumbnailPath?: string | null;
  videoCoverPath?: string | null;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
  isFeatured?: boolean;
  sortOrder?: number;
  takenAt?: string | null;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO works (
        title, description, type, category_id, original_path, compressed_path,
        thumbnail_path, video_cover_path, width, height, file_size, is_featured,
        sort_order, taken_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.description ?? null,
      input.type,
      input.categoryId,
      input.originalPath,
      input.compressedPath ?? null,
      input.thumbnailPath ?? null,
      input.videoCoverPath ?? null,
      input.width ?? null,
      input.height ?? null,
      input.fileSize ?? null,
      input.isFeatured ? 1 : 0,
      input.sortOrder ?? 0,
      input.takenAt ?? null,
    );

  return Number(result.lastInsertRowid);
}

export function updateWork(
  id: number,
  input: {
    title: string;
    description?: string;
    categoryId: number;
    isFeatured?: boolean;
    sortOrder?: number;
    takenAt?: string | null;
    videoCoverPath?: string | null;
  },
) {
  const coverSql = input.videoCoverPath !== undefined ? ", video_cover_path = ?" : "";
  const params: Array<string | number | null> = [
    input.title,
    input.description ?? null,
    input.categoryId,
    input.isFeatured ? 1 : 0,
    input.sortOrder ?? 0,
    input.takenAt || null,
  ];
  if (input.videoCoverPath !== undefined) params.push(input.videoCoverPath);
  params.push(id);

  getDb()
    .prepare(
      `UPDATE works
       SET title = ?, description = ?, category_id = ?, is_featured = ?,
           sort_order = ?, taken_at = ?${coverSql}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .run(...params);
}

export function deleteWork(id: number) {
  const work = getWork(id);
  getDb().prepare("DELETE FROM works WHERE id = ?").run(id);
  return work;
}
