import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { deleteLiveAlbum, updateLiveAlbum } from "@/lib/live";
import { removeLocalMedia, saveUploadedFile } from "@/lib/media";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const albumId = Number(id);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "update");

  if (intent === "delete") {
    const album = deleteLiveAlbum(albumId);
    if (album) {
      await removeLocalMedia([album.cover_path]);
    }
    redirect("/admin/live");
  }

  const cover = formData.get("cover");
  let coverPath: string | null = null;

  if (cover instanceof File && cover.size > 0) {
    const media = await saveUploadedFile(cover);
    coverPath = media.compressedPath || media.thumbnailPath || media.originalPath;
  }

  updateLiveAlbum(albumId, {
    title: String(formData.get("title") || "研学直播相册"),
    description: String(formData.get("description") || ""),
    liveUrl: String(formData.get("liveUrl") || ""),
    coverPath,
    enabled: formData.get("enabled") === "on",
    sortOrder: Number(formData.get("sortOrder") || 0),
  });

  redirect("/admin/live");
}
