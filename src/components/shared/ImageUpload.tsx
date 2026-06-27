"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, Loader2, X, ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  /** Called with the uploaded image's secure URL once upload succeeds */
  onUploadComplete: (url: string) => void;
  /** Existing image URL, if editing something that already has one */
  initialUrl?: string;
  /** Cloudinary folder to upload into — keeps content types organized */
  folder?: string;
  className?: string;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB, matches API route limit

export function ImageUpload({
  onUploadComplete,
  initialUrl,
  folder = "studentos",
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be under 8MB");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Upload failed");
      }

      setPreview(json.data.url);
      onUploadComplete(json.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(initialUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    setPreview(null);
    setError("");
    onUploadComplete("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden",
          preview ? "border-transparent aspect-video" : "aspect-video",
          dragOver ? "border-forest bg-forest/5" : "border-border bg-sage/30 hover:border-forest/40"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onInputChange}
          className="hidden"
        />

        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- preview can be a local blob: URL pre-upload, which next/image can't optimize */}
            <img src={preview} alt="Upload preview" className="absolute inset-0 h-full w-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
                <Loader2 className="h-6 w-6 text-white animate-spin" aria-hidden="true" />
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white hover:bg-ink transition-colors"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-border">
              {uploading ? (
                <Loader2 className="h-4 w-4 text-forest animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted" />
              )}
            </span>
            <p className="text-sm text-muted text-center px-4">
              <span className="font-medium text-forest">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted/70">PNG, JPG, WebP up to 8MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-forest hover:text-forest-600 transition-colors self-start"
        >
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          Choose image
        </button>
      )}
    </div>
  );
}
