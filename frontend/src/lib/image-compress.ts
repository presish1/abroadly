const MAX_PROFILE_IMAGE_BYTES = 250 * 1024;
const MAX_PROFILE_IMAGE_DIMENSION = 1600;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

async function canvasBlobToFile(
  canvas: HTMLCanvasElement,
  originalName: string,
  quality: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Compression failed"));
      resolve(new File([blob], originalName.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
    }, "image/jpeg", quality);
  });
}

export async function compressImageToTarget(file: File, targetBytes = MAX_PROFILE_IMAGE_BYTES): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= targetBytes && file.type === "image/jpeg") return file;

  const img = await loadImage(file);
  let { width, height } = img;
  if (width > MAX_PROFILE_IMAGE_DIMENSION || height > MAX_PROFILE_IMAGE_DIMENSION) {
    const ratio = Math.min(MAX_PROFILE_IMAGE_DIMENSION / width, MAX_PROFILE_IMAGE_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let output = await canvasBlobToFile(canvas, file.name, quality);
  while (output.size > targetBytes && quality > 0.5) {
    quality -= 0.1;
    output = await canvasBlobToFile(canvas, file.name, quality);
  }

  return output;
}
