const { onRequest } = require('firebase-functions/v2/https');
const { gemini15Flash, googleAI } = require('@genkit-ai/googleai');
const { genkit } = require('genkit');

// Configuración inicial de Genkit
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: gemini15Flash,
});

// Importamos tu flujo original (asegúrate de que la ruta coincida con lo que movimos)
const { suggestShiftAssignmentsFlow } = require('./src/suggest-shift-assignments');

// Exponemos la función como un Endpoint HTTP
exports.suggestShifts = onRequest(
  { cors: true }, // Importante para que Vercel pueda consumirlo sin errores de CORS
  async (req, res) => {
    // Solo aceptamos POST
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      // Usamos el payload tal cual llega desde Vercel (actions.ts)
      const input = req.body;

      if (!input) {
        return res.status(400).send('Faltan datos en el payload.');
      }

      // Ejecutamos el flujo de IA
      const result = await ai.runFlow(suggestShiftAssignmentsFlow, input);
      
      // Devolvemos el resultado a Vercel
      res.status(200).json(result);
    } catch (error) {
      console.error('Error ejecutando Genkit:', error);
      res.status(500).json({ error: 'Error interno en el procesamiento de IA' });
    }
  }
);
