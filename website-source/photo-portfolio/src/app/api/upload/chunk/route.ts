import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { saveUploadedFile, saveUploadedTempFile } from "@/lib/media";
import { createWork } from "@/lib/works";

export const runtime = "nodejs";

const chunkRoot = path.join(process.cwd(), "data", "upload-chunks");

function cleanId(value: FormDataEntryValue | null) {
  const id = String(value || "");
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return null;
  return id;
}

function getTitle(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const totalFiles = Number(formData.get("totalFiles") || 1);
  const fileIndex = Number(formData.get("fileIndex") || 0);
  if (!title) return "";
  return totalFiles > 1 ? `${title} ${fileIndex + 1}` : title;
}

async function assembleChunks(uploadId: string, fileName: string, totalChunks: number) {
  const uploadDir = path.join(chunkRoot, uploadId);
  const assembledPath = path.join(uploadDir, `complete-${Date.now()}-${path.basename(fileName)}`);
  const handle = await fs.open(assembledPath, "w");

  try {
    for (let index = 0; index < totalChunks; index += 1) {
      const chunkPath = path.join(uploadDir, `${index}.part`);
      const chunk = await fs.readFile(chunkPath);
      await handle.write(chunk);
    }
  } finally {
    await handle.close();
  }

  return assembledPath;
}

export async function POST(request: Request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const uploadId = cleanId(formData.get("uploadId"));
  const chunk = formData.get("chunk");
  const fileName = path.basename(String(formData.get("fileName") || "upload.bin"));
  const fileType = String(formData.get("fileType") || "application/octet-stream");
  const chunkIndex = Number(formData.get("chunkIndex"));
  const totalChunks = Number(formData.get("totalChunks"));

  if (!uploadId || !(chunk instanceof File) || chunk.size === 0 || !Number.isInteger(chunkIndex)) {
    return NextResponse.json({ error: "Invalid chunk" }, { status: 400 });
  }
  if (!Number.isInteger(totalChunks) || totalChunks < 1 || chunkIndex < 0 || chunkIndex >= totalChunks) {
    return NextResponse.json({ error: "Invalid chunk index" }, { status: 400 });
  }

  const uploadDir = path.join(chunkRoot, uploadId);
  await fs.mkdir(uploadDir, { recursive: true });
  const chunkPath = path.join(uploadDir, `${chunkIndex}.part`);
  await fs.writeFile(chunkPath, Buffer.from(await chunk.arrayBuffer()));

  if (chunkIndex < totalChunks - 1) {
    return NextResponse.json({ done: false });
  }

  const assembledPath = await assembleChunks(uploadId, fileName, totalChunks);
  const media = await saveUploadedTempFile(assembledPath, fileName, fileType);
  const cover = formData.get("videoCover");
  const coverMedia =
    media.type === "video" && cover instanceof File && cover.size > 0
      ? await saveUploadedFile(cover)
      : null;

  createWork({
    title: getTitle(formData),
    description: String(formData.get("description") || ""),
    type: media.type,
    categoryId: Number(formData.get("categoryId")),
    originalPath: media.originalPath,
    compressedPath: media.compressedPath,
    thumbnailPath: media.thumbnailPath,
    videoCoverPath: coverMedia?.thumbnailPath || coverMedia?.compressedPath || null,
    width: media.width,
    height: media.height,
    fileSize: media.fileSize,
    isFeatured: formData.get("isFeatured") === "true",
    sortOrder: Number(formData.get("sortOrder") || 0) + Number(formData.get("fileIndex") || 0),
  });

  await fs.rm(uploadDir, { recursive: true, force: true });
  return NextResponse.json({ done: true });
}
