import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { Call } from '../types';

export function useCalls(propertyId: string) {
  const { user } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !propertyId) {
      setCalls([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/properties/${propertyId}/calls`),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const callList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          propertyId,
          ...data,
          date: data.date?.toDate() || new Date(),
        } as Call;
      });
      setCalls(callList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, propertyId]);

  const addCall = async (call: Omit<Call, 'id' | 'propertyId'>) => {
    if (!user || !propertyId) return;

    await addDoc(collection(db, `users/${user.uid}/properties/${propertyId}/calls`), {
      ...call,
      date: Timestamp.fromDate(call.date),
    });
  };

  const deleteCall = async (callId: string) => {
    if (!user || !propertyId) return;

    const ref = doc(db, `users/${user.uid}/properties/${propertyId}/calls`, callId);
    await deleteDoc(ref);
  };

  return {
    calls,
    loading,
    addCall,
    deleteCall,
  };
}
