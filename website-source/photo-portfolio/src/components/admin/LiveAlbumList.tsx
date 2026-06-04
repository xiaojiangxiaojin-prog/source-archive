import Link from "next/link";
import type { LiveAlbum } from "@/lib/types";

export function LiveAlbumList({ albums }: { albums: LiveAlbum[] }) {
  if (!albums.length) {
    return <p className="rounded-md border border-[#f7f2e8]/10 bg-white/[0.035] p-5 text-[#a9a093]">还没有直播相册。</p>;
  }

  return (
    <div className="grid gap-4">
      {albums.map((album) => (
        <div
          key={album.id}
          className="grid gap-4 rounded-md border border-[#f7f2e8]/10 bg-white/[0.035] p-4 md:grid-cols-[160px_1fr_auto]"
        >
          <div className="h-28 overflow-hidden rounded-md bg-[#15130f]">
            {album.cover_path ? (
              <img src={album.cover_path} alt={album.title} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-medium text-white">{album.title}</h3>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#c9c0b1]">
                {album.enabled ? "显示中" : "已隐藏"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#a9a093]">{album.description}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#8d8375]">
              <span>排序：{album.sort_order}</span>
              <a href={album.live_url ?? "#"} target="_blank" rel="noopener noreferrer" className="break-all hover:text-[#d7b56d]">
                {album.live_url}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Link href={`/admin/live/${album.id}`} className="rounded bg-white/10 px-3 py-2 text-sm text-white">
              编辑
            </Link>
            <form action={`/api/live-albums/${album.id}`} method="post">
              <input type="hidden" name="intent" value="delete" />
              <button className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-100">删除</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
