import { AdminNav } from "@/components/admin/AdminNav";
import { LiveAlbumForm } from "@/components/admin/LiveAlbumForm";
import { LiveAlbumList } from "@/components/admin/LiveAlbumList";
import { requireAdmin } from "@/lib/auth";
import { getLiveAlbums } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  await requireAdmin();
  const albums = getLiveAlbums();

  return (
    <main className="min-h-screen bg-[#11100e] text-[#f7f2e8] lg:flex">
      <AdminNav />
      <section className="flex-1 px-5 py-8 lg:px-10">
        <div className="max-w-5xl">
          <p className="text-sm uppercase tracking-[0.24em] text-[#d7b56d]">Live Albums</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">研学直播相册管理</h1>
          <p className="mt-4 leading-7 text-[#a9a093]">
            可以添加多个喔图直播相册，每个相册都有独立链接、封面、排序和显示状态。
          </p>
          <div className="mt-5 rounded-md border border-[#f7f2e8]/10 bg-white/[0.045] p-4 text-sm leading-7 text-[#c9c0b1]">
            建议封面使用横图，标题控制在 8 到 18 个字。排序数字越小越靠前，隐藏后不会在首页和研学页展示。
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-medium text-white">已有相册</h2>
            <div className="mt-4">
              <LiveAlbumList albums={albums} />
            </div>
          </section>

          <section className="mt-10 max-w-3xl rounded-md border border-[#f7f2e8]/10 bg-white/[0.045] p-5">
            <h2 className="mb-5 text-xl font-medium text-white">新增相册</h2>
            <LiveAlbumForm />
          </section>
        </div>
      </section>
    </main>
  );
}
