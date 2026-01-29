import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { uploadPropertyPhotos } from '../lib/storage';
import type { Property, PropertyStatus } from '../types';

export function useProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProperties([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/properties`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const props = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Property;
      });
      setProperties(props);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addProperty = async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    // Si son URLs (no base64), no hay límite. Si son base64, limitar a 4.
    const allPhotos = property.photos || [];
    const hasBase64 = allPhotos.some(p => p.startsWith('data:'));
    const photos = hasBase64 ? allPhotos.slice(0, 4) : allPhotos;

    // Filtrar valores undefined (Firestore no los acepta)
    const cleanProperty = Object.fromEntries(
      Object.entries({ ...property, photos }).filter(([, v]) => v !== undefined)
    );

    // 1. Guardar inmediatamente con URLs originales
    const docRef = await addDoc(collection(db, `users/${user.uid}/properties`), {
      ...cleanProperty,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 2. Background: subir fotos a Firebase Storage (fire & forget)
    const hasExternal = photos.some(
      (p) => !p.startsWith('data:') && !p.includes('firebasestorage') && !p.includes('googleapis.com'),
    );
    if (hasExternal) {
      uploadPropertyPhotos(photos, docRef.id, user.uid)
        .then(async (firebaseUrls) => {
          const ref = doc(db, `users/${user.uid}/properties`, docRef.id);
          await updateDoc(ref, { photos: firebaseUrls, updatedAt: Timestamp.now() });
        })
        .catch((err) => console.error('Background photo upload failed:', err));
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    if (!user) return;

    const ref = doc(db, `users/${user.uid}/properties`, id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  };

  const updateStatus = async (id: string, status: PropertyStatus) => {
    await updateProperty(id, { status });
  };

  const deleteProperty = async (id: string) => {
    if (!user) return;

    const ref = doc(db, `users/${user.uid}/properties`, id);
    await deleteDoc(ref);
  };

  return {
    properties,
    loading,
    addProperty,
    updateProperty,
    updateStatus,
    deleteProperty,
  };
}
