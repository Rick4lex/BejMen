import { addDays, format, subDays, startOfMonth, getDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Messenger, Client, Shift } from "./types";

const messengers: Messenger[] = [];

const clients: Client[] = [];

const initialShifts: Shift[] = [];

export const getMessengers = () => messengers;
export const getClients = () => clients;
export const getInitialShifts = () => initialShifts;
