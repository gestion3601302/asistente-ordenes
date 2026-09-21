import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// La API Key se lee de forma segura desde las variables de entorno de Vercel
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/interpretar', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;

    if (!base64Image) {
      return res.status(400).json({ success: false, error: 'No se recibió ninguna imagen.' });
    }

    const prompt = `Actúa como un experto en recepción de laboratorios de análisis clínicos y diagnóstico por imágenes.
Analiza detenidamente la imagen de la orden médica adjunta y extrae la información formateada claramente en Markdown:

- **Paciente:** Nombre y Apellido
- **DNI / Afiliado:** Número de documento o carnet
- **Obra Social / Prepaga:** Cobertura médica
- **Médico Solicitante:** Nombre y Matrícula (M.P. / M.N.)
- **Análisis / Estudios Solicitados:** Lista detallada punto por punto de los estudios manuscritos o tildados
- **Diagnóstico / Notas:** Diagnósticos expresados o aclaraciones del profesional

Si algún dato no figura en la orden o no es legible, indica "No especificado".`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: base64Image
          }
        }
      ]
    });

    res.json({ success: true, text: response.text });

  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    res.status(500).json({ success: false, error: error.message || 'Error interno del servidor.' });
  }
});

export default app;