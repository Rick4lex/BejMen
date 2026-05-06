export type MessengerStatus = 'active' | 'stranded' | 'incapacitated' | 'on_leave';
export type ShiftPreference = 'day' | 'night' | 'any';

export type Messenger = {
  id: string;
  name: string;
  avatarUrl: string;
  status: MessengerStatus;
  availableWeekdays: number[]; // 0 for Sunday, 6 for Saturday
  shiftPreference: ShiftPreference;
};

export type Client = {
  id: string;
  name: string;
};

export type Shift = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., "08:00 - 16:00"
  clientId: string;
  messengerId?: string;
  notes: string;
};
