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

export interface SavedSimulation {
  id: string;
  propertyId: string;
  propertyZone: string;
  propertyAddress: string;
  // Inputs
  effectivePrice: number;
  basePrice: number;
  downPct: number;
  rate: number;
  years: number;
  itpReduced: boolean;
  priceExVat: boolean;
  includeRenovation: boolean;
  renovationBudget: number;
  customPrice: number | null;
  // Results
  totalNeededForPurchase: number;
  totalMonthly: number;
  monthlyMortgage: number;
  percentageOfIncome: number;
  verdictText: string;
  bankFinances: number;
  // Meta
  createdAt: Date;
  updatedAt: Date;
}

type SimData = Omit<SavedSimulation, 'id' | 'createdAt' | 'updatedAt'>;

export function useSimulations() {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSimulations([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/simulations`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
        } as SavedSimulation;
      });
      setSimulations(list);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const saveSimulation = async (sim: SimData) => {
    if (!user) return;
    const now = Timestamp.now();
    await addDoc(collection(db, `users/${user.uid}/simulations`), {
      ...sim,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateSimulation = async (id: string, sim: SimData) => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/simulations`, id);
    await updateDoc(ref, {
      ...sim,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteSimulation = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/simulations`, id));
  };

  return { simulations, loading, saveSimulation, updateSimulation, deleteSimulation };
}
