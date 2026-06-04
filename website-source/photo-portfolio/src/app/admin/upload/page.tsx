import { AdminNav } from "@/components/admin/AdminNav";
import { UploadForm } from "@/components/admin/UploadForm";
import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/works";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-[#11100e] text-[#f7f2e8] lg:flex">
      <AdminNav />
      <section className="flex-1 px-5 py-8 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.24em] text-[#d7b56d]">Upload</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">上传作品</h1>
          <p className="mt-4 text-sm leading-7 text-[#a9a093]">
            支持批量选择图片和视频，大文件会自动分片上传，上传过程中可以看到总进度和单个文件进度。
          </p>
          <div className="mt-8 rounded-md border border-[#f7f2e8]/10 bg-white/[0.045] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <UploadForm categories={getCategories()} />
          </div>
        </div>
      </section>
    </main>
  );
}
