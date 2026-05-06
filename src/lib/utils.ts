import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ShiftPreference } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getShiftType(time: string): 'day' | 'night' {
  if (!time || !time.includes(' - ')) {
    return 'day';
  }
  try {
    const startTimeStr = time.split(' - ')[0];
    const hour = parseInt(startTimeStr.split(':')[0], 10);
    
    // Consider shifts starting before 3 PM (15:00) as 'day' shifts
    return hour < 15 ? 'day' : 'night';
  } catch {
    return 'day';
  }
}
