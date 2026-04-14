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
import type { Visit } from '../types';

export function useVisits() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setVisits([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/visits`),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitList = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          date: data.date?.toDate() || new Date(),
        } as Visit;
      });
      setVisits(visitList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addVisit = async (visit: Omit<Visit, 'id'>) => {
    if (!user) return;

    await addDoc(collection(db, `users/${user.uid}/visits`), {
      ...visit,
      date: Timestamp.fromDate(visit.date),
    });
  };

  const updateVisit = async (id: string, updates: Partial<Omit<Visit, 'id'>>) => {
    if (!user) return;

    const ref = doc(db, `users/${user.uid}/visits`, id);
    const data: Record<string, unknown> = { ...updates };
    if (updates.date) {
      data.date = Timestamp.fromDate(updates.date);
    }
    await updateDoc(ref, data);
  };

  const deleteVisit = async (id: string) => {
    if (!user) return;

    const ref = doc(db, `users/${user.uid}/visits`, id);
    await deleteDoc(ref);
  };

  return {
    visits,
    loading,
    addVisit,
    updateVisit,
    deleteVisit,
  };
}
