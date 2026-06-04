import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const uploadRoot = path.join(process.cwd(), "public", "uploads");

function publicPath(filePath: string) {
  return filePath.replace(path.join(process.cwd(), "public"), "").replaceAll(path.sep, "/");
}

export async function saveUploadedFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return saveUploadedBuffer(buffer, file.name, file.type);
}

export async function saveUploadedTempFile(tempPath: string, fileName: string, mimeType: string) {
  const now = new Date();
  const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const originalDir = path.join(uploadRoot, "originals", folder);
  const compressedDir = path.join(uploadRoot, "compressed", folder);
  const thumbnailDir = path.join(uploadRoot, "thumbnails", folder);
  await fs.mkdir(originalDir, { recursive: true });
  await fs.mkdir(compressedDir, { recursive: true });
  await fs.mkdir(thumbnailDir, { recursive: true });

  const ext = path.extname(fileName).toLowerCase();
  const safeBase = `${Date.now()}-${randomUUID()}`;
  const originalPath = path.join(originalDir, `${safeBase}${ext}`);

  const isVideo = mimeType.startsWith("video/");
  if (isVideo) {
    await fs.copyFile(tempPath, originalPath);
    await fs.rm(tempPath, { force: true });
    const stats = await fs.stat(originalPath);
    return {
      type: "video" as const,
      originalPath: publicPath(originalPath),
      compressedPath: null,
      thumbnailPath: null,
      width: null,
      height: null,
      fileSize: stats.size,
    };
  }

  const buffer = await fs.readFile(tempPath);
  await fs.writeFile(originalPath, buffer);
  await fs.rm(tempPath, { force: true });
  return saveImageBuffer(buffer, originalPath, compressedDir, thumbnailDir, safeBase);
}

export async function saveUploadedBuffer(buffer: Buffer, fileName: string, mimeType: string) {
  const now = new Date();
  const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const originalDir = path.join(uploadRoot, "originals", folder);
  const compressedDir = path.join(uploadRoot, "compressed", folder);
  const thumbnailDir = path.join(uploadRoot, "thumbnails", folder);
  await fs.mkdir(originalDir, { recursive: true });
  await fs.mkdir(compressedDir, { recursive: true });
  await fs.mkdir(thumbnailDir, { recursive: true });

  const ext = path.extname(fileName).toLowerCase();
  const safeBase = `${Date.now()}-${randomUUID()}`;
  const originalPath = path.join(originalDir, `${safeBase}${ext}`);
  await fs.writeFile(originalPath, buffer);

  const isVideo = mimeType.startsWith("video/");
  if (isVideo) {
    return {
      type: "video" as const,
      originalPath: publicPath(originalPath),
      compressedPath: null,
      thumbnailPath: null,
      width: null,
      height: null,
      fileSize: buffer.length,
    };
  }

  return saveImageBuffer(buffer, originalPath, compressedDir, thumbnailDir, safeBase);
}

async function saveImageBuffer(
  buffer: Buffer,
  originalPath: string,
  compressedDir: string,
  thumbnailDir: string,
  safeBase: string,
) {
  const compressedPath = path.join(compressedDir, `${safeBase}.webp`);
  const thumbnailPath = path.join(thumbnailDir, `${safeBase}.webp`);
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();

  await sharp(buffer)
    .rotate()
    .resize({ width: 2200, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(compressedPath);

  await sharp(buffer)
    .rotate()
    .resize({ width: 720, withoutEnlargement: true })
    .webp({ quality: 76 })
    .toFile(thumbnailPath);

  return {
    type: "image" as const,
    originalPath: publicPath(originalPath),
    compressedPath: publicPath(compressedPath),
    thumbnailPath: publicPath(thumbnailPath),
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    fileSize: buffer.length,
  };
}

export async function removeLocalMedia(paths: Array<string | null | undefined>) {
  await Promise.all(
    paths
      .filter(
        (mediaPath): mediaPath is string =>
          typeof mediaPath === "string" && mediaPath.startsWith("/uploads/"),
      )
      .map(async (mediaPath) => {
        const fullPath = path.join(process.cwd(), "public", mediaPath);
        await fs.rm(fullPath, { force: true });
      }),
  );
}
