import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { getCategories, getWork } from "@/lib/works";

export const dynamic = "force-dynamic";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const work = getWork(Number(id));
  if (!work) notFound();
  const categories = getCategories();

  return (
    <main className="min-h-screen bg-[#11100e] text-[#f7f2e8] lg:flex">
      <AdminNav />
      <section className="flex-1 px-5 py-8 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.24em] text-[#d7b56d]">Edit</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">编辑作品</h1>
          <form
            action={`/api/works/${work.id}`}
            method="post"
            encType="multipart/form-data"
            className="mt-8 grid gap-5 rounded-md border border-[#f7f2e8]/10 bg-white/[0.045] p-5"
          >
            <input type="hidden" name="intent" value="update" />
            <label className="grid gap-2">
              <span className="text-sm text-[#c9c0b1]">标题（可选）</span>
              <input
                name="title"
                defaultValue={work.title}
                className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-[#c9c0b1]">简介</span>
              <textarea
                name="description"
                rows={4}
                defaultValue={work.description ?? ""}
                className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-white"
              />
            </label>
            {work.type === "video" ? (
              <label className="grid gap-2">
                <span className="text-sm text-[#c9c0b1]">视频封面图</span>
                {work.video_cover_path ? (
                  <img src={work.video_cover_path} alt="当前视频封面" className="h-44 w-full rounded-md object-cover" />
                ) : null}
                <input
                  type="file"
                  name="videoCover"
                  accept="image/*"
                  className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-sm text-[#e5dac8]"
                />
              </label>
            ) : null}
            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm text-[#c9c0b1]">分类</span>
                <select
                  name="categoryId"
                  defaultValue={work.category_id}
                  className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-white"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-[#c9c0b1]">排序</span>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={work.sort_order}
                  className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-white"
                />
              </label>
              <label className="flex items-end gap-3 rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-sm text-[#e5dac8]">
                <input type="checkbox" name="isFeatured" defaultChecked={Boolean(work.is_featured)} className="h-4 w-4" />
                首页精选
              </label>
            </div>
            <button className="w-fit rounded-full bg-[#f7f2e8] px-6 py-3 text-sm font-medium text-[#15130f]">
              保存修改
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
