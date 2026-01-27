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
import type { Reminder } from '../types';

export function useReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/reminders`),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reminderList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
        } as Reminder;
      });
      setReminders(reminderList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addReminder = async (reminder: Omit<Reminder, 'id'>) => {
    if (!user) return;

    await addDoc(collection(db, `users/${user.uid}/reminders`), {
      ...reminder,
      date: Timestamp.fromDate(reminder.date),
    });
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    if (!user) return;

    const ref = doc(db, `users/${user.uid}/reminders`, id);
    await updateDoc(ref, { completed });
  };

  const deleteReminder = async (id: string) => {
    if (!user) return;

    const ref = doc(db, `users/${user.uid}/reminders`, id);
    await deleteDoc(ref);
  };

  const pendingReminders = reminders.filter((r) => !r.completed && r.date <= new Date());

  return {
    reminders,
    loading,
    addReminder,
    toggleReminder,
    deleteReminder,
    pendingReminders,
  };
}
