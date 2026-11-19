import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Content Manager AI Generator Endpoint
app.post('/api/content-manager/generate', async (req, res) => {
  try {
    const { 
      clientCompany, 
      industry, 
      audience, 
      product, 
      tone, 
      goal, 
      differentiator,
      brief,
      servicesAndProducts
    } = req.body;

    const companyName = clientCompany || 'Negocio';
    const mainProduct = product || servicesAndProducts || 'servicios profesionales';
    const clientServices = servicesAndProducts || mainProduct;
    const clientBrief = brief || 'Enfoque en soluciones de alta calidad, innovación y valor tangible para el consumidor';
    const targetAudience = audience || 'clientes potenciales';
    const brandTone = tone || 'viral y dinámico';
    const campaignGoal = goal || 'generar prospectos y ventas';
    const diff = differentiator || 'calidad garantizada y atención personalizada';

    const systemPrompt = `Eres un estratega experto en contenido viral para TikTok, Instagram Reels, YouTube Shorts y LinkedIn con millones de reproducciones.
Tu trabajo es generar ideas de contenido y guiones de video virales altamente personalizados aprovechando el CONTEXTO y BRIEF oficial del cliente:
- Negocio / Empresa: ${companyName}
- Giro Comercial / Industria: ${industry || 'General'}
- Servicios y Productos Clave del Cliente: ${clientServices}
- Brief de Marca y Antecedentes: ${clientBrief}
- Audiencia Objetivo (Buyer Persona): ${targetAudience}
- Tono de Marca: ${brandTone}
- Objetivo de Campaña: ${campaignGoal}
- Diferenciador Clave: ${diff}

Debes utilizar de forma explícita los servicios, productos, giro y brief comercial del cliente para que los ganchos y guiones se sientan 100% auténticos y hechos a medida de su negocio.

Debes responder ÚNICAMENTE con un arreglo JSON válido (sin formato markdown adicional ni texto fuera del JSON) con exactamente 5 ideas de contenido virales.
Cada objeto del arreglo debe tener exactamente esta estructura TypeScript:
{
  "id": string (único, ej: "gemini-1"),
  "title": string (título atractivo del video),
  "niche": "${industry || 'general'}",
  "archetype": "pov" | "3_errores" | "antes_despues" | "detras_camaras" | "asmr_proceso" | "skit_humor" | "mito_realidad" | "reto_viral",
  "archetypeLabel": string (ej: "POV Bucle Infinito", "3 Errores Fatales", etc.),
  "platform": "tiktok" | "instagram" | "youtube" | "linkedin",
  "platformsSupported": ["tiktok", "instagram", "youtube"],
  "viralScore": number (entre 92 y 99),
  "hookSpoken": string (lo que dice a cámara en los primeros 3 segundos, impactante),
  "hookOnScreen": string (texto grande en pantalla para detener el scroll),
  "hookVisualAction": string (acción física o movimiento de cámara de los primeros 3s),
  "conceptSummary": string (resumen del concepto en 1-2 oraciones),
  "scriptSteps": [
    {
      "timeRange": "0s - 3s",
      "stepTitle": "Gancho de Interrupción",
      "description": string,
      "spokenText": string,
      "visualCue": string,
      "screenCaption": string
    },
    {
      "timeRange": "3s - 15s",
      "stepTitle": "El Problema / Tensión",
      "description": string,
      "spokenText": string,
      "visualCue": string,
      "screenCaption": string
    },
    {
      "timeRange": "15s - 35s",
      "stepTitle": "La Solución / Demostración",
      "description": string,
      "spokenText": string,
      "visualCue": string,
      "screenCaption": string
    },
    {
      "timeRange": "35s - 45s",
      "stepTitle": "Llamado a la Acción (CTA)",
      "description": string,
      "spokenText": string,
      "visualCue": string,
      "screenCaption": string
    }
  ],
  "soundTrend": {
    "name": string (nombre del sonido o tipo de audio viral),
    "type": "synth_beat" | "lofi_chill" | "comedy_audio" | "suspense_rising" | "pop_upbeat" | "acoustic_guitar",
    "vibe": string,
    "exampleSearch": string (cómo buscarlo en TikTok o Reels)
  },
  "caption": string (copy persuasivo listo para publicar con llamada a la acción),
  "hashtags": string[] (5 a 7 hashtags virales y de nicho),
  "recordingTips": string[] (3 consejos técnicos de grabación para ese video),
  "ctaGoal": string,
  "aiGenerated": true
}`;

    const ai = getAI();
    // Cascade through candidate models to gracefully handle high demand (503) or rate limits
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash'
    ];

    let parsedIdeas: any = null;
    let successfulModel = '';

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const responseText = response.text || '';
        let cleanJson = responseText.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        const data = JSON.parse(cleanJson);
        if (Array.isArray(data) && data.length > 0) {
          parsedIdeas = data;
          successfulModel = model;
          break;
        } else if (data && Array.isArray(data.ideas) && data.ideas.length > 0) {
          parsedIdeas = data.ideas;
          successfulModel = model;
          break;
        }
      } catch (err: any) {
        // Continue to next candidate model if 503 or transient unavailability
        continue;
      }
    }

    if (parsedIdeas && Array.isArray(parsedIdeas) && parsedIdeas.length > 0) {
      return res.json({ success: true, ideas: parsedIdeas, model: successfulModel });
    }

    // If all models hit limits or failed, return clean fallback signal
    return res.status(200).json({ 
      success: false, 
      fallback: true, 
      message: 'Utilizando generador algorítmico de tendencias virales' 
    });
  } catch {
    // Return friendly fallback without throwing raw error objects
    return res.status(200).json({ 
      success: false, 
      fallback: true, 
      message: 'Utilizando generador algorítmico de tendencias virales' 
    });
  }
});

// Vite server integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
