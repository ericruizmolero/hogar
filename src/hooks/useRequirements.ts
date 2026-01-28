import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { setRequirements as setGlobalRequirements, DEFAULT_REQUIREMENTS } from '../lib/requirements';

export interface Requirements {
  minUsableM2: number;
  minBuiltM2: number;
  minBathrooms: number;
  minRooms: number;
  maxPrice: number;
  maxPriceRenovation: number;
  minFloor: number;
  requireElevator: boolean;
  preferredZones: string[];
  preferredOrientations: string[];
  minYear: number;
}

export function useRequirements() {
  const { user } = useAuth();
  const [requirements, setRequirementsState] = useState<Requirements>(DEFAULT_REQUIREMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRequirementsState(DEFAULT_REQUIREMENTS);
      setGlobalRequirements(DEFAULT_REQUIREMENTS);
      setLoading(false);
      return;
    }

    const loadRequirements = async () => {
      try {
        const docRef = doc(db, `users/${user.uid}/settings/requirements`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const loaded = { ...DEFAULT_REQUIREMENTS, ...docSnap.data() } as Requirements;
          setRequirementsState(loaded);
          setGlobalRequirements(loaded);
        } else {
          setGlobalRequirements(DEFAULT_REQUIREMENTS);
        }
      } catch (error) {
        console.error('Error loading requirements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequirements();
  }, [user]);

  const updateRequirements = async (newRequirements: Partial<Requirements>) => {
    if (!user) return;

    const updated = { ...requirements, ...newRequirements };
    setRequirementsState(updated);
    setGlobalRequirements(updated);

    try {
      const docRef = doc(db, `users/${user.uid}/settings/requirements`);
      await setDoc(docRef, updated);
    } catch (error) {
      console.error('Error saving requirements:', error);
    }
  };

  const resetRequirements = async () => {
    await updateRequirements(DEFAULT_REQUIREMENTS);
  };

  return {
    requirements,
    loading,
    updateRequirements,
    resetRequirements,
    DEFAULT_REQUIREMENTS,
  };
}
