import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface FinancialProfile {
  // Ahorros
  savings1: number;
  savings2: number;
  // Ingresos mensuales netos
  income1: number;
  income2: number;
  // Gastos mensuales estimados de vivienda
  monthlyExpenses: number;
}

export const DEFAULT_FINANCIAL_PROFILE: FinancialProfile = {
  savings1: 75000,
  savings2: 75000,
  income1: 2500,
  income2: 2200,
  monthlyExpenses: 200,
};

export function useFinancialProfile() {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<FinancialProfile>(DEFAULT_FINANCIAL_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfileState(DEFAULT_FINANCIAL_PROFILE);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const docRef = doc(db, `users/${user.uid}/settings/financial`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const loaded = { ...DEFAULT_FINANCIAL_PROFILE, ...docSnap.data() } as FinancialProfile;
          setProfileState(loaded);
        }
      } catch (error) {
        console.error('Error loading financial profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const updateProfile = async (newProfile: Partial<FinancialProfile>) => {
    if (!user) return;

    const updated = { ...profile, ...newProfile };
    setProfileState(updated);

    try {
      const docRef = doc(db, `users/${user.uid}/settings/financial`);
      await setDoc(docRef, updated);
    } catch (error) {
      console.error('Error saving financial profile:', error);
    }
  };

  const resetProfile = async () => {
    await updateProfile(DEFAULT_FINANCIAL_PROFILE);
  };

  return {
    profile,
    loading,
    updateProfile,
    resetProfile,
  };
}
