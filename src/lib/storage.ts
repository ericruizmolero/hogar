import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Comprime una imagen local a un data URL JPEG mediante canvas.
 * Reduce el ancho a maxWidth (manteniendo aspect ratio) y re-encodea a la calidad indicada.
 */
export async function fileToCompressedDataUrl(
  file: File,
  { maxWidth = 1200, quality = 0.8 }: { maxWidth?: number; quality?: number } = {},
): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });

  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Imagen inválida'));
    image.src = dataUrl;
  });

  const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
  const width = Math.round(img.width * ratio);
  const height = Math.round(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Descarga fotos externas a través del proxy y las sube a Firebase Storage.
 * Devuelve un array de URLs de Firebase Storage.
 * Si una foto ya es Firebase Storage o data:, se mantiene tal cual.
 * Si falla la descarga/subida, se mantiene la URL original.
 */
export async function uploadPropertyPhotos(
  photos: string[],
  propertyId: string,
  userId: string,
  onProgress?: (completed: number, total: number) => void,
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];

    // Ya es Firebase Storage o data: → skip
    if (
      photo.startsWith('data:') ||
      photo.includes('firebasestorage') ||
      photo.includes('googleapis.com')
    ) {
      results.push(photo);
      onProgress?.(i + 1, photos.length);
      continue;
    }

    try {
      // Descargar via proxy
      const base = import.meta.env.DEV ? 'http://localhost:5001' : '';
      const proxyUrl = `${base}/api/image-proxy?url=${encodeURIComponent(photo)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const storagePath = `users/${userId}/properties/${propertyId}/photo_${i}.jpg`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, blob, {
        contentType: blob.type || 'image/jpeg',
      });

      const downloadUrl = await getDownloadURL(storageRef);
      results.push(downloadUrl);
    } catch (error) {
      console.warn(`Photo ${i} upload failed, keeping original URL:`, error);
      results.push(photo);
    }

    onProgress?.(i + 1, photos.length);
  }

  return results;
}
