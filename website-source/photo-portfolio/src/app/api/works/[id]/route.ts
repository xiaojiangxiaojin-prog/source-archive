import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { removeLocalMedia, saveUploadedFile } from "@/lib/media";
import { deleteWork, getWork, updateWork } from "@/lib/works";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const workId = Number(id);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "update");

  if (intent === "delete") {
    const work = deleteWork(workId);
    if (work) {
      await removeLocalMedia([
        work.original_path,
        work.compressed_path,
        work.thumbnail_path,
        work.video_cover_path,
      ]);
    }
    redirect("/admin");
  }

  const work = getWork(workId);
  const cover = formData.get("videoCover");
  const coverMedia =
    work?.type === "video" && cover instanceof File && cover.size > 0
      ? await saveUploadedFile(cover)
      : null;

  if (coverMedia && work?.video_cover_path) {
    await removeLocalMedia([work.video_cover_path]);
  }

  updateWork(workId, {
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    categoryId: Number(formData.get("categoryId")),
    isFeatured: formData.get("isFeatured") === "on",
    sortOrder: Number(formData.get("sortOrder") || 0),
    videoCoverPath: coverMedia?.thumbnailPath || coverMedia?.compressedPath,
  });

  redirect("/admin");
}
