// This service abstracts the data layer, making it easy to switch between
// localStorage (local mode) and a remote database (cloud mode) in the future.

import { getInitialShifts, getMessengers, getClients } from './mock-data';
import type { Shift, Messenger, Client } from './types';

const isBrowser = typeof window !== 'undefined';

const LocalStorageService = {
  // SHIFTS
  getShifts: (): Shift[] => {
    if (!isBrowser) return [];
    const data = localStorage.getItem('shifts');
    if (data) {
      return JSON.parse(data);
    }
    // If no data, initialize with mock data
    const initialData = getInitialShifts();
    LocalStorageService.saveShifts(initialData);
    return initialData;
  },
  saveShifts: (shifts: Shift[]) => {
    if (!isBrowser) return;
    localStorage.setItem('shifts', JSON.stringify(shifts));
  },

  // MESSENGERS
  getMessengers: (): Messenger[] => {
    if (!isBrowser) return [];
    const data = localStorage.getItem('messengers');
    if (data) {
        return JSON.parse(data);
    }
    const initialData = getMessengers();
    LocalStorageService.saveMessengers(initialData);
    return initialData;
  },
  saveMessengers: (messengers: Messenger[]) => {
    if (!isBrowser) return;
    localStorage.setItem('messengers', JSON.stringify(messengers));
  },

  // CLIENTS
  getClients: (): Client[] => {
    if (!isBrowser) return [];
    const data = localStorage.getItem('clients');
    if (data) {
        return JSON.parse(data);
    }
    const initialData = getClients();
    LocalStorageService.saveClients(initialData);
    return initialData;
  },
  saveClients: (clients: Client[]) => {
    if (!isBrowser) return;
    localStorage.setItem('clients', JSON.stringify(clients));
  },

  // ALL DATA
  getAllData: () => {
    return {
      shifts: LocalStorageService.getShifts(),
      messengers: LocalStorageService.getMessengers(),
      clients: LocalStorageService.getClients(),
    };
  },
  saveAllData: (data: { shifts: Shift[], messengers: Messenger[], clients: Client[] }) => {
    LocalStorageService.saveShifts(data.shifts);
    LocalStorageService.saveMessengers(data.messengers);
    LocalStorageService.saveClients(data.clients);
  }
};

// In the future, you could create a FirestoreService that implements the same methods.
// Then, you would just change which service is exported here.
export const dataService = LocalStorageService;
