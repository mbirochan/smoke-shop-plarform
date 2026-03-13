"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { UploadBucket } from "@/lib/upload";

interface FileUploadProps {
  bucket: UploadBucket;
  entityId?: string;
  accept?: string;
  maxSizeMB?: number;
  onUploadComplete: (publicUrl: string) => void;
  label?: string;
  previewUrl?: string;
}

export function FileUpload({
  bucket,
  entityId,
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMB = 5,
  onUploadComplete,
  label = "Upload file",
  previewUrl,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const presignMutation = trpc.upload.getPresignedUrl.useMutation();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be smaller than ${maxSizeMB}MB`);
        return;
      }

      const allowedTypes = accept.split(",").map((t) => t.trim());
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type");
        return;
      }

      if (file.type === "image/svg+xml") {
        setError("SVG files are not allowed");
        return;
      }

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }

      setUploading(true);
      setProgress(0);

      try {
        const { uploadUrl, publicUrl } = await presignMutation.mutateAsync({
          bucket,
          filename: file.name,
          contentType: file.type,
          entityId,
        });

        const xhr = new XMLHttpRequest();
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        onUploadComplete(publicUrl);
      } catch {
        setError("Upload failed. Please try again.");
        setPreview(previewUrl ?? null);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [bucket, entityId, maxSizeMB, accept, onUploadComplete, presignMutation, previewUrl],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading... {progress}%</p>
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : preview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="mx-auto max-h-32 rounded-md object-contain"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
              }}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
