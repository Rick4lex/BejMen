"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Shift, Messenger, Client } from '@/lib/types';
import { format, startOfWeek, endOfWeek } from 'date-fns';

// Define the shape of the context data
interface DataContextType {
  shifts: Shift[];
  messengers: Messenger[];
  clients: Client[];
  addShift: (shift: Shift) => void;
  updateShift: (shift: Partial<Shift> & { id: string }) => void;
  deleteShift: (shiftId: string) => void;
  addShiftsBatch: (shifts: Shift[]) => void;
  deleteShiftsForDay: (day: Date) => void;
  deleteShiftsForWeek: (weekStart: Date) => void;
  setMessengers: (messengers: Messenger[]) => void;
  setClients: (clients: Client[]) => void;
  isLoading: boolean;
  importData: (data: { shifts: Shift[], messengers: Messenger[], clients: Client[] }) => void;
}

// Create the context
export const DataContext = createContext<DataContextType | undefined>(undefined);

// Create the provider component
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [messengers, setMessengersState] = useState<Messenger[]>([]);
  const [clients, setClientsState] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedShifts = localStorage.getItem('shifts');
      const storedMessengers = localStorage.getItem('messengers');
      const storedClients = localStorage.getItem('clients');

      setShifts(storedShifts ? JSON.parse(storedShifts) : []);
      setMessengersState(storedMessengers ? JSON.parse(storedMessengers) : []);
      setClientsState(storedClients ? JSON.parse(storedClients) : []);
      setIsLoading(false);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
      localStorage.setItem('shifts', JSON.stringify(shifts));
      localStorage.setItem('messengers', JSON.stringify(messengers));
      localStorage.setItem('clients', JSON.stringify(clients));
    }
  }, [shifts, messengers, clients, isLoading]);

  const importData = useCallback((data: { shifts: Shift[], messengers: Messenger[], clients: Client[] }) => {
    setShifts(data.shifts);
    setMessengersState(data.messengers);
    setClientsState(data.clients);
  }, []);

  // CRUD for Shifts
  const addShift = (shift: Shift) => {
    setShifts([...shifts, shift]);
  };
  
  const addShiftsBatch = (newShifts: Shift[]) => {
    setShifts([...shifts, ...newShifts]);
  }

  const updateShift = (updatedShift: Partial<Shift> & { id: string }) => {
    setShifts(shifts.map(s => s.id === updatedShift.id ? { ...s, ...updatedShift } : s));
  };

  const deleteShift = (shiftId: string) => {
    setShifts(shifts.filter(s => s.id !== shiftId));
  };
  
  const deleteShiftsForDay = (day: Date) => {
    const dateToDel = format(day, 'yyyy-MM-dd');
    setShifts(shifts.filter(s => s.date !== dateToDel));
  };

  const deleteShiftsForWeek = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    setShifts(shifts.filter(s => s.date < weekStartStr || s.date > weekEndStr));
  };

  // Setters for Messengers and Clients
  const setMessengers = (newMessengers: Messenger[]) => {
    setMessengersState(newMessengers);
  };

  const setClients = (newClients: Client[]) => {
    setClientsState(newClients);
  };

  const value = {
    shifts,
    messengers,
    clients,
    addShift,
    updateShift,
    deleteShift,
    addShiftsBatch,
    deleteShiftsForDay,
    deleteShiftsForWeek,
    setMessengers,
    setClients,
    isLoading,
    importData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
