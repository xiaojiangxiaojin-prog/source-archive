import type { LiveAlbum } from "@/lib/types";
import { FallbackImage } from "./FallbackImage";

export function LiveAlbumGrid({ albums }: { albums: LiveAlbum[] }) {
  if (!albums.length) return null;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {albums.map((album) => (
        <a
          key={album.id}
          href={album.live_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-md border border-[#f7f2e8]/12 bg-[#181611] shadow-[0_20px_60px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-0.5 hover:border-[#d7b56d]/55"
        >
          <div className="relative min-h-[270px] overflow-hidden md:min-h-[350px]">
            <FallbackImage
              src={album.cover_path}
              alt={album.title}
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0b]/92 via-[#0d0c0b]/24 to-transparent" />
            <div className="absolute left-5 top-5 rounded-full border border-[#d7b56d]/35 bg-black/35 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#f2d99f] backdrop-blur">
              Live Album
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <h3 className="text-balance text-3xl font-semibold text-[#fff8ec]">{album.title}</h3>
              {album.description ? (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#c9c0b1]">{album.description}</p>
              ) : null}
              <span className="mt-5 inline-flex rounded-full bg-[#f7f2e8] px-5 py-2.5 text-sm font-medium text-[#15130f] transition group-hover:bg-white">
                进入相册
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
