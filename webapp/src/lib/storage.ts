import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

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
