import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { categories } from "./constants";

const dataDir = path.join(process.cwd(), "data");
const dbPath = process.env.DATABASE_PATH ?? path.join(dataDir, "database.sqlite");

let db: Database.Database | null = null;

function ensureSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'image',
      category_id INTEGER NOT NULL,
      original_path TEXT NOT NULL,
      compressed_path TEXT,
      thumbnail_path TEXT,
      video_cover_path TEXT,
      width INTEGER,
      height INTEGER,
      file_size INTEGER,
      is_featured INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      taken_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS live_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      title TEXT NOT NULL DEFAULT '研学直播相册',
      description TEXT,
      live_url TEXT,
      cover_path TEXT,
      enabled INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS live_albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      live_url TEXT,
      cover_path TEXT,
      enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  database
    .prepare("INSERT OR IGNORE INTO live_settings (id, title, description) VALUES (1, ?, ?)")
    .run("研学直播相册", "点击进入喔图直播相册，查看研学现场影像。");

  migrateLegacyLiveSettings(database);
  ensureCategories(database);
  ensureAdmin(database);
  ensureDemoWorks(database);
}

function migrateLegacyLiveSettings(database: Database.Database) {
  const albumCount = database.prepare("SELECT COUNT(*) AS count FROM live_albums").get() as {
    count: number;
  };
  if (albumCount.count > 0) return;

  const oldSettings = database.prepare("SELECT * FROM live_settings WHERE id = 1").get() as
    | {
        title: string;
        description: string | null;
        live_url: string | null;
        cover_path: string | null;
        enabled: number;
      }
    | undefined;

  if (!oldSettings?.live_url && !oldSettings?.cover_path) return;

  database
    .prepare(
      `INSERT INTO live_albums (title, description, live_url, cover_path, enabled, sort_order)
       VALUES (?, ?, ?, ?, ?, 0)`,
    )
    .run(
      oldSettings.title || "研学直播相册",
      oldSettings.description,
      oldSettings.live_url,
      oldSettings.cover_path,
      oldSettings.enabled,
    );
}

function ensureCategories(database: Database.Database) {
  const insertCategory = database.prepare(
    "INSERT OR IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, ?)",
  );
  const updateCategory = database.prepare("UPDATE categories SET name = ?, sort_order = ? WHERE slug = ?");
  categories.forEach((category, index) => {
    insertCategory.run(category.name, category.slug, index + 1);
    updateCategory.run(category.name, index + 1, category.slug);
  });
}

function ensureAdmin(database: Database.Database) {
  const adminCount = database.prepare("SELECT COUNT(*) AS count FROM admins").get() as {
    count: number;
  };
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (adminCount.count === 0 && username && password) {
    database
      .prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)")
      .run(username, bcrypt.hashSync(password, 12));
  }
}

function ensureDemoWorks(database: Database.Database) {
  const workCount = database.prepare("SELECT COUNT(*) AS count FROM works").get() as {
    count: number;
  };
  if (workCount.count !== 0) return;

  const getCategoryId = database.prepare("SELECT id FROM categories WHERE slug = ?");
  const insertWork = database.prepare(`
    INSERT INTO works (
      title, description, type, category_id, original_path, compressed_path,
      thumbnail_path, width, height, is_featured, sort_order, taken_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoWorks = [
    {
      title: "研学途中",
      description: "把课堂带到真实世界里。",
      category: "study",
      image:
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=85",
      width: 1600,
      height: 1067,
      featured: 1,
    },
    {
      title: "自然光人像",
      description: "克制、干净、保留人物本身的气息。",
      category: "portrait",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=85",
      width: 1067,
      height: 1600,
      featured: 1,
    },
    {
      title: "影像片段",
      description: "视频作品示例，后台可上传真实视频文件。",
      category: "video",
      image:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=85",
      width: 1600,
      height: 1067,
      featured: 1,
      type: "video",
    },
  ];

  demoWorks.forEach((work, index) => {
    const category = getCategoryId.get(work.category) as { id: number };
    insertWork.run(
      work.title,
      work.description,
      work.type ?? "image",
      category.id,
      work.image,
      work.image,
      work.image,
      work.width,
      work.height,
      work.featured,
      index + 1,
      null,
    );
  });
}

export function getDb() {
  if (!db) {
    fs.mkdirSync(dataDir, { recursive: true });
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    ensureSchema(db);
  }
  return db;
}
