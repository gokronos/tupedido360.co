const MAX_DIMENSION = 1200;
const MAX_UPLOAD_BYTES = 700 * 1024;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No fue posible leer esta imagen.")); };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

function asDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No fue posible preparar la imagen."));
    reader.readAsDataURL(blob);
  });
}

export async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Selecciona una foto válida.");
  if (file.size > 15 * 1024 * 1024) throw new Error("La foto original no puede superar 15 MB.");

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Este navegador no permite comprimir imágenes.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let blob: Blob | null = null;
  for (const quality of [0.82, 0.7, 0.58, 0.46]) {
    blob = await canvasBlob(canvas, quality);
    if (blob && blob.size <= MAX_UPLOAD_BYTES) break;
  }
  if (!blob || blob.size > MAX_UPLOAD_BYTES) throw new Error("No fue posible reducir la foto. Prueba con otra imagen.");
  return { dataUrl: await asDataUrl(blob), size: blob.size };
}
