import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import app from './firebase';

const storage = getStorage(app);

export async function uploadBase64Image(
  base64Data: string,
  path: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path);

    // Si es una URL normal (no base64), devolverla tal cual
    if (!base64Data.startsWith('data:')) {
      return base64Data;
    }

    // Subir imagen en base64
    const snapshot = await uploadString(storageRef, base64Data, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    // Si falla, devolver la imagen original
    return base64Data;
  }
}

export async function uploadPropertyImages(
  images: string[],
  propertyId: string,
  userId: string
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const path = `users/${userId}/properties/${propertyId}/photo_${i}.jpg`;

    try {
      const url = await uploadBase64Image(image, path);
      uploadedUrls.push(url);
    } catch (error) {
      console.error(`Error uploading image ${i}:`, error);
      // Si falla, usar la imagen original
      uploadedUrls.push(image);
    }
  }

  return uploadedUrls;
}
