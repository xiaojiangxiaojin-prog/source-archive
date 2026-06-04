export type WorkType = "image" | "video";

export type Category = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
};

export type Work = {
  id: number;
  title: string;
  description: string | null;
  type: WorkType;
  category_id: number;
  category_name: string;
  category_slug: string;
  original_path: string;
  compressed_path: string | null;
  thumbnail_path: string | null;
  video_cover_path: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  is_featured: number;
  sort_order: number;
  taken_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LiveAlbum = {
  id: number;
  title: string;
  description: string | null;
  live_url: string | null;
  cover_path: string | null;
  enabled: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
