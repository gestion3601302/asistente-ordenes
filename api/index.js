import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Asegurar cabecera JSON siempre
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { base64Image, mimeType } = req.body || {};

    if (!base64Image) {
      return res.status(400).json({ success: false, error: 'No se recibió ninguna imagen.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Falta la variable GEMINI_API_KEY en Vercel.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Actúa como un experto en recepción de laboratorios de análisis clínicos.
Analiza detenidamente la imagen de la orden médica adjunta y extrae la información formateada claramente:

- **Paciente:** Nombre y Apellido
- **DNI / Afiliado:** Número de documento o carnet
- **Obra Social / Prepaga:** Nombre de la cobertura
- **Médico Solicitante:** Nombre y Matrícula
- **Análisis / Estudios Solicitados:** Lista detallada punto por punto
- **Diagnóstico / Notas:** Diagnósticos o aclaraciones manuscritas

Si algún dato no figura en la orden o no es legible, indica "No especificado".`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    return res.status(200).json({ success: true, text: response.text });

  } catch (error) {
    console.error('Error en Vercel Function:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || error.toString() || 'Error interno al procesar la imagen con Gemini.' 
    });
  }
}
