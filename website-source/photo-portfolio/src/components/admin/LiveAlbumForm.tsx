import type { LiveAlbum } from "@/lib/types";

export function LiveAlbumForm({ album }: { album?: LiveAlbum }) {
  const action = album ? `/api/live-albums/${album.id}` : "/api/live-albums";

  return (
    <form action={action} method="post" encType="multipart/form-data" className="grid gap-5">
      {album ? <input type="hidden" name="intent" value="update" /> : null}
      <label className="grid gap-2">
        <span className="text-sm text-[#c9c0b1]">相册标题</span>
        <input
          name="title"
          required
          defaultValue={album?.title ?? ""}
          className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-white outline-none focus:border-[#d7b56d]/55"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-[#c9c0b1]">喔图直播相册链接</span>
        <input
          name="liveUrl"
          type="url"
          required
          placeholder="https://..."
          defaultValue={album?.live_url ?? ""}
          className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-white outline-none focus:border-[#d7b56d]/55"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-[#c9c0b1]">说明文字</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={album?.description ?? ""}
          className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-white outline-none focus:border-[#d7b56d]/55"
        />
      </label>
      <div className="grid gap-5 md:grid-cols-[1fr_160px]">
        <label className="grid gap-2">
          <span className="text-sm text-[#c9c0b1]">封面图</span>
          {album?.cover_path ? (
            <img src={album.cover_path} alt="当前封面" className="h-44 w-full rounded-md object-cover" />
          ) : null}
          <input
            type="file"
            name="cover"
            accept="image/*"
            className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-sm text-[#e5dac8]"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-[#c9c0b1]">排序</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={album?.sort_order ?? 0}
            className="rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-white"
          />
        </label>
      </div>
      <label className="flex items-center gap-3 rounded-md border border-[#f7f2e8]/10 bg-[#15130f] px-4 py-3 text-sm text-[#e5dac8]">
        <input type="checkbox" name="enabled" defaultChecked={album ? Boolean(album.enabled) : true} className="h-4 w-4" />
        显示在首页和研学分类页
      </label>
      <button className="w-fit rounded-full bg-[#f7f2e8] px-6 py-3 text-sm font-medium text-[#15130f] transition hover:bg-white">
        {album ? "保存相册" : "新增相册"}
      </button>
    </form>
  );
}
