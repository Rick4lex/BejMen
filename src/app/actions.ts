'use server'

import { suggestShiftAssignments, type SuggestShiftAssignmentsInput, type SuggestShiftAssignmentsOutput } from '@/ai/flows/suggest-shift-assignments'
import { loadBackupFromDrive, saveBackupToDrive } from '@/ai/flows/drive-backup-flow'
import type { Client, Messenger, Shift } from '@/lib/types';

export async function getAiSuggestions(input: SuggestShiftAssignmentsInput): Promise<{
    success: boolean;
    data?: SuggestShiftAssignmentsOutput;
    error?: string;
}> {
  try {
    const result = await suggestShiftAssignments(input)
    return { success: true, data: result }
  } catch (error) {
    console.error(error)
    // In a real app, you would want to log this error to a monitoring service.
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, error: `Error al obtener sugerencias de la IA: ${errorMessage}` }
  }
}

export async function saveBackup(data: { shifts: Shift[], messengers: Messenger[], clients: Client[] }) {
    try {
        const result = await saveBackupToDrive(data);
        return { success: true, message: result };
    } catch (error) {
        console.error("Error saving backup to Drive:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
    }
}

export async function loadBackup() {
    try {
        const data = await loadBackupFromDrive();
        return { success: true, data };
    } catch (error) {
        console.error("Error loading backup from Drive:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
    }
}
