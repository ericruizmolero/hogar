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

    // Filtrar fotos base64 (muy grandes para Firestore) y quedarnos solo con URLs
    const photos = (property.photos || []).filter(p => !p.startsWith('data:'));

    await addDoc(collection(db, `users/${user.uid}/properties`), {
      ...property,
      photos,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
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
