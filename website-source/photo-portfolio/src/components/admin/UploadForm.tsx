"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import type { Category } from "@/lib/types";

const chunkSize = 8 * 1024 * 1024;

type FileProgress = {
  name: string;
  loaded: number;
  size: number;
  status: "waiting" | "uploading" | "done" | "error";
};

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function uploadChunk(formData: FormData, onProgress: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/chunk");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(xhr.responseText || `上传失败：${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("网络连接中断，上传失败"));
    xhr.send(formData);
  });
}

export function UploadForm({ categories }: { categories: Category[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasVideo, setHasVideo] = useState(false);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const totalLoaded = useMemo(() => files.reduce((sum, file) => sum + file.loaded, 0), [files]);
  const totalPercent = totalSize ? Math.round((totalLoaded / totalSize) * 100) : 0;
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const selectedFiles = Array.from(fileInputRef.current?.files || []);
    const videoCover = coverInputRef.current?.files?.[0];
    if (!selectedFiles.length || isUploading) return;

    const shared = new FormData(form);
    setIsUploading(true);
    setMessage("");
    setFiles(selectedFiles.map((file) => ({ name: file.name, loaded: 0, size: file.size, status: "waiting" })));

    try {
      for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex += 1) {
        const file = selectedFiles[fileIndex];
        const uploadId = `${crypto.randomUUID()}-${fileIndex}`;
        const totalChunks = Math.ceil(file.size / chunkSize);

        setFiles((current) =>
          current.map((item, index) => (index === fileIndex ? { ...item, status: "uploading" } : item)),
        );

        let confirmedLoaded = 0;
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);
          const chunkForm = new FormData();
          chunkForm.set("uploadId", uploadId);
          chunkForm.set("chunkIndex", String(chunkIndex));
          chunkForm.set("totalChunks", String(totalChunks));
          chunkForm.set("fileIndex", String(fileIndex));
          chunkForm.set("totalFiles", String(selectedFiles.length));
          chunkForm.set("fileName", file.name);
          chunkForm.set("fileType", file.type || "application/octet-stream");
          chunkForm.set("title", String(shared.get("title") || ""));
          chunkForm.set("description", String(shared.get("description") || ""));
          chunkForm.set("categoryId", String(shared.get("categoryId") || ""));
          chunkForm.set("sortOrder", String(shared.get("sortOrder") || "0"));
          chunkForm.set("isFeatured", shared.get("isFeatured") ? "true" : "false");
          chunkForm.set("chunk", chunk, file.name);
          if (chunkIndex === totalChunks - 1 && file.type.startsWith("video/") && videoCover) {
            chunkForm.set("videoCover", videoCover, videoCover.name);
          }

          await uploadChunk(chunkForm, (chunkLoaded) => {
            setFiles((current) =>
              current.map((item, index) =>
                index === fileIndex
                  ? { ...item, loaded: Math.min(confirmedLoaded + chunkLoaded, file.size) }
                  : item,
              ),
            );
          });

          confirmedLoaded = end;
          setFiles((current) =>
            current.map((item, index) =>
              index === fileIndex ? { ...item, loaded: confirmedLoaded } : item,
            ),
          );
        }

        setFiles((current) =>
          current.map((item, index) => (index === fileIndex ? { ...item, loaded: file.size, status: "done" } : item)),
        );
      }

      setMessage("上传完成，正在返回作品管理页。");
      window.location.href = "/admin";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败，请重试。");
      setFiles((current) =>
        current.map((item) => (item.status === "uploading" ? { ...item, status: "error" } : item)),
      );
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm text-neutral-300">作品文件</span>
        <input
          ref={fileInputRef}
          required
          multiple
          type="file"
          name="files"
          accept="image/*,video/*"
          onChange={(event) =>
            {
              const selected = Array.from(event.currentTarget.files || []);
              setHasVideo(selected.some((file) => file.type.startsWith("video/")));
              setFiles(
              selected.map((file) => ({
                name: file.name,
                loaded: 0,
                size: file.size,
                status: "waiting",
              })),
            );
            }
          }
          className="rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-neutral-200"
        />
        <span className="text-xs text-neutral-500">可以一次选择多张图片或多个视频，大文件会自动分片上传。</span>
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-neutral-300">视频封面图（可选）</span>
        <input
          ref={coverInputRef}
          type="file"
          name="videoCover"
          accept="image/*"
          className="rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-neutral-200"
        />
        <span className="text-xs text-neutral-500">
          上传视频时建议选择一张横图作为封面；批量上传多个视频时会共用这张封面。
          {hasVideo ? "" : " 只上传照片时可以留空。"}
        </span>
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-neutral-300">标题（可选）</span>
        <input
          name="title"
          placeholder="不填则前台不显示标题；批量上传时会作为标题前缀"
          className="rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/30"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-neutral-300">简介</span>
        <textarea
          name="description"
          rows={4}
          className="rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/30"
        />
      </label>
      <div className="grid gap-5 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm text-neutral-300">分类</span>
          <select name="categoryId" className="rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-white">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-neutral-300">排序</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            className="rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-white"
          />
        </label>
        <label className="flex items-end gap-3 rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-neutral-200">
          <input type="checkbox" name="isFeatured" className="h-4 w-4" />
          首页精选
        </label>
      </div>

      {files.length ? (
        <div className="grid gap-3 rounded-md border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between text-sm text-neutral-300">
            <span>
              总进度 {totalPercent}% · {formatSize(totalLoaded)} / {formatSize(totalSize)}
            </span>
            <span>{files.length} 个文件</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${totalPercent}%` }} />
          </div>
          <div className="grid gap-2">
            {files.map((file) => {
              const percent = file.size ? Math.round((file.loaded / file.size) * 100) : 0;
              return (
                <div key={file.name} className="grid gap-1 text-xs text-neutral-400">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-neutral-300">{file.name}</span>
                    <span className="shrink-0">
                      {file.status === "done" ? "完成" : file.status === "error" ? "失败" : `${percent}%`}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-neutral-300" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm text-neutral-300">{message}</p> : null}

      <button
        disabled={isUploading}
        className="w-fit rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? "上传中..." : "上传作品"}
      </button>
    </form>
  );
}
