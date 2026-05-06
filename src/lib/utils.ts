import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ShiftPreference } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getShiftType(startTime: string): 'day' | 'night' {
  if (!startTime) {
    return 'day';
  }
  try {
    const hour = parseInt(startTime.split(':')[0], 10);
    
    // Consider shifts starting before 3 PM (15:00) as 'day' shifts
    return hour < 15 ? 'day' : 'night';
  } catch {
    return 'day';
  }
}
