import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { getWorks } from "@/lib/works";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const works = getWorks();

  return (
    <main className="min-h-screen bg-[#11100e] text-[#f7f2e8] lg:flex">
      <AdminNav />
      <section className="flex-1 px-5 py-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#d7b56d]">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">作品管理</h1>
          </div>
          <Link href="/admin/upload" className="rounded-full bg-[#f7f2e8] px-5 py-3 text-sm font-medium text-[#15130f]">
            上传作品
          </Link>
        </div>
        <div className="overflow-hidden rounded-md border border-[#f7f2e8]/10 bg-white/[0.035] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead className="bg-white/[0.04] text-left text-[#a9a093]">
              <tr>
                <th className="px-4 py-3">作品</th>
                <th className="px-4 py-3">分类</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">精选</th>
                <th className="px-4 py-3">排序</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {works.map((work) => (
                <tr key={work.id} className="border-t border-[#f7f2e8]/10 text-[#e5dac8]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {work.thumbnail_path || work.compressed_path || work.video_cover_path ? (
                        <img
                          src={work.thumbnail_path || work.compressed_path || work.video_cover_path || ""}
                          alt={work.title || work.category_name}
                          className="h-14 w-20 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded bg-[#15130f] text-xs text-[#d7b56d]">
                          VIDEO
                        </div>
                      )}
                      <span>{work.title || "未填写标题"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{work.category_name}</td>
                  <td className="px-4 py-3">{work.type === "video" ? "视频" : "图片"}</td>
                  <td className="px-4 py-3">{work.is_featured ? "是" : "否"}</td>
                  <td className="px-4 py-3">{work.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/works/${work.id}/edit`} className="rounded bg-white/10 px-3 py-2">
                        编辑
                      </Link>
                      <form action={`/api/works/${work.id}`} method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <button className="rounded bg-red-500/20 px-3 py-2 text-red-100">删除</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
