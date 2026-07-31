"use client";

import { ImageIcon, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";

export function ImageUpload({ value, onChange, label = "Foto" }: { value: string; onChange: (value: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true); setError("");
    try {
      const compressed = await compressImage(file);
      const response = await fetch("/api/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dataUrl: compressed.dataUrl }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No fue posible cargar la foto.");
      onChange(result.url);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No fue posible cargar la foto.");
    } finally { setUploading(false); }
  }

  return <div className="image-upload">
    <span className="image-upload-label">{label}</span>
    <div className="image-upload-row">
      <div className="image-upload-preview" style={value ? { backgroundImage: `url(${value})` } : undefined}>{!value && <ImageIcon size={28} />}</div>
      <div className="image-upload-actions">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={select} hidden />
        <button className="secondary-action" type="button" disabled={uploading} onClick={() => input.current?.click()}><Upload size={18} />{uploading ? "Comprimiendo..." : value ? "Cambiar foto" : "Cargar foto"}</button>
        {value && <button className="image-remove" type="button" disabled={uploading} onClick={() => onChange("")}><Trash2 size={17} />Quitar</button>}
        <small>JPG, PNG o WebP. Se comprime automáticamente.</small>
      </div>
    </div>
    {error && <small className="image-upload-error" role="alert">{error}</small>}
  </div>;
}
