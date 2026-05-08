'use server'

import type { Client, Messenger, Shift } from '@/lib/types';

export interface SuggestShiftAssignmentsInput {
  messengerAvailability: string;
  shiftRequirements: string;
  otherConstraints?: string;
}

export interface SuggestShiftAssignmentsOutput {
  suggestedAssignments: string;
  reasoning: string;
}

export async function getAiSuggestions(input: SuggestShiftAssignmentsInput): Promise<{
    success: boolean;
    data?: SuggestShiftAssignmentsOutput;
    error?: string;
}> {
  try {
    // Reemplazaremos esta URL con la de producción de Google Cloud más adelante
    const endpoint = process.env.NEXT_PUBLIC_AI_ENDPOINT || 'http://127.0.0.1:5001/tu-proyecto/us-central1/suggestShifts';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error('Error en el microservicio de IA');
    
    const result = await response.json();
    return { success: true, data: result }
  } catch (error) {
    console.error("Error al obtener sugerencias:", error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, error: `Error al obtener sugerencias de la IA: ${errorMessage}` }
  }
}
