import type { ChecklistAttachment } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB original
const MAX_DIMENSION = 800; // px máximo por lado
const JPEG_QUALITY = 0.6;

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `El archivo supera el limite de 10 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
  }
  if (!file.type.startsWith('image/')) {
    return 'Solo se permiten imagenes (JPG, PNG, WebP, HEIC)';
  }
  return null;
}

/**
 * Comprime una imagen a JPEG ≤800px y devuelve un data URI base64.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const dataUri = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      resolve(dataUri);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };

    img.src = url;
  });
}

export async function processChecklistImage(file: File): Promise<ChecklistAttachment> {
  const data = await compressImage(file);
  return {
    id: crypto.randomUUID(),
    data,
    name: file.name,
    type: 'image',
    size: file.size,
    createdAt: Date.now(),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
