import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { createLiveAlbum } from "@/lib/live";
import { saveUploadedFile } from "@/lib/media";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const formData = await request.formData();
  const cover = formData.get("cover");
  let coverPath: string | null = null;

  if (cover instanceof File && cover.size > 0) {
    const media = await saveUploadedFile(cover);
    coverPath = media.compressedPath || media.thumbnailPath || media.originalPath;
  }

  createLiveAlbum({
    title: String(formData.get("title") || "研学直播相册"),
    description: String(formData.get("description") || ""),
    liveUrl: String(formData.get("liveUrl") || ""),
    coverPath,
    enabled: formData.get("enabled") === "on",
    sortOrder: Number(formData.get("sortOrder") || 0),
  });

  redirect("/admin/live");
}
