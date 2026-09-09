// Browser-only: shrink a user photo before it leaves the device. A phone
// camera JPEG is 3–8 MB; a 1600px JPEG at q0.82 is ~250 KB and looks
// identical in a 300px passport card. Saves upload time on mobile data and
// keeps the private bucket small.

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export interface ResizedImage {
  blob: Blob;
  contentType: "image/jpeg";
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // imageOrientation honours EXIF rotation so portrait phone shots don't
      // come out sideways.
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to the <img> path (older Safari)
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode_failed"));
    };
    img.src = url;
  });
}

export async function resizeImage(file: File): Promise<ResizedImage> {
  const source = await decode(file);
  const srcW = "naturalWidth" in source ? source.naturalWidth : source.width;
  const srcH = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!srcW || !srcH) throw new Error("decode_failed");

  const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.drawImage(source, 0, 0, w, h);
  if ("close" in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) throw new Error("encode_failed");
  return { blob, contentType: "image/jpeg" };
}
