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

// Import the data service
import { dataService } from '@/lib/data-service';

// Create the provider component
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [messengers, setMessengersState] = useState<Messenger[]>([]);
  const [clients, setClientsState] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const { shifts, messengers, clients } = dataService.getAllData();
    setShifts(shifts);
    setMessengersState(messengers);
    setClientsState(clients);
    setIsLoading(false);
  }, []);
  
  const importData = useCallback((data: { shifts: Shift[], messengers: Messenger[], clients: Client[] }) => {
    dataService.saveAllData(data);
    setShifts(data.shifts);
    setMessengersState(data.messengers);
    setClientsState(data.clients);
  }, []);

  // CRUD for Shifts
  const addShift = (shift: Shift) => {
    const newShifts = [...shifts, shift];
    dataService.saveShifts(newShifts);
    setShifts(newShifts);
  };
  
  const addShiftsBatch = (newShifts: Shift[]) => {
    const updatedShifts = [...shifts, ...newShifts];
    dataService.saveShifts(updatedShifts);
    setShifts(updatedShifts);
  }

  const updateShift = (updatedShift: Partial<Shift> & { id: string }) => {
    const newShifts = shifts.map(s => s.id === updatedShift.id ? { ...s, ...updatedShift } : s);
    dataService.saveShifts(newShifts);
    setShifts(newShifts);
  };

  const deleteShift = (shiftId: string) => {
    const newShifts = shifts.filter(s => s.id !== shiftId);
    dataService.saveShifts(newShifts);
    setShifts(newShifts);
  };
  
  const deleteShiftsForDay = (day: Date) => {
    const dateToDel = format(day, 'yyyy-MM-dd');
    const newShifts = shifts.filter(s => s.date !== dateToDel);
    dataService.saveShifts(newShifts);
    setShifts(newShifts);
  };

  const deleteShiftsForWeek = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    const newShifts = shifts.filter(s => s.date < weekStartStr || s.date > weekEndStr);
    dataService.saveShifts(newShifts);
    setShifts(newShifts);
  };

  // Setters for Messengers and Clients
  const setMessengers = (newMessengers: Messenger[]) => {
    dataService.saveMessengers(newMessengers);
    setMessengersState(newMessengers);
  };

  const setClients = (newClients: Client[]) => {
    dataService.saveClients(newClients);
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
