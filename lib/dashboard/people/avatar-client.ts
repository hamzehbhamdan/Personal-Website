export function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Image too large (max 8MB)."));
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 80, cv = document.createElement("canvas"); cv.width = size; cv.height = size;
        const ctx = cv.getContext("2d")!; const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        try { resolve(cv.toDataURL("image/jpeg", 0.82)); } catch { reject(new Error("Could not process image.")); }
      };
      img.onerror = () => reject(new Error("Could not load image."));
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}
