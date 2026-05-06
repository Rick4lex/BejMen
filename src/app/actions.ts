'use server'

import { suggestShiftAssignments, type SuggestShiftAssignmentsInput, type SuggestShiftAssignmentsOutput } from '@/ai/flows/suggest-shift-assignments'
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

