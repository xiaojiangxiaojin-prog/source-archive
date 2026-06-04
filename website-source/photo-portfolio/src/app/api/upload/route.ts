import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/media";
import { createWork } from "@/lib/works";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const formData = await request.formData();
  const files = [...formData.getAll("files"), formData.get("file")].filter(
    (file): file is File => file instanceof File && file.size > 0,
  );
  if (!files.length) {
    return new Response("Missing file", { status: 400 });
  }

  const baseTitle = String(formData.get("title") || "").trim();
  const cover = formData.get("videoCover");
  const coverMedia = cover instanceof File && cover.size > 0 ? await saveUploadedFile(cover) : null;
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const media = await saveUploadedFile(file);
    createWork({
      title: baseTitle && files.length > 1 ? `${baseTitle} ${index + 1}` : baseTitle,
      description: String(formData.get("description") || ""),
      type: media.type,
      categoryId: Number(formData.get("categoryId")),
      originalPath: media.originalPath,
      compressedPath: media.compressedPath,
      thumbnailPath: media.thumbnailPath,
      videoCoverPath:
        media.type === "video" ? coverMedia?.thumbnailPath || coverMedia?.compressedPath || null : null,
      width: media.width,
      height: media.height,
      fileSize: media.fileSize,
      isFeatured: formData.get("isFeatured") === "on",
      sortOrder: Number(formData.get("sortOrder") || 0) + index,
    });
  }

  redirect("/admin");
}
