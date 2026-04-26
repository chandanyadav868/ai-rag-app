import { NextResponse } from 'next/server'
import { GoogleGenAI, createUserContent } from '@google/genai'

// This route performs a single-shot (non-streaming) call to Google GenAI SDK
// and returns the final generated content as JSON. The client should call
// this endpoint when it wants the complete response rather than streaming.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt || '';
    const model = body.model || 'gemini-2.5-flash';
    const system = body.system || undefined;

    const key = process.env.GOOGLE_GEMINA_API || process.env.GOOGLE_GEMINA_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: 'GOOGLE_GEMINA_API not configured' }, { status: 500 });

    const ai: any = new GoogleGenAI({ apiKey: String(key) });

    // Prefer SDK single-shot generation
    if (ai.responses && typeof ai.responses.create === 'function') {
      // Use responses.create which supports richer inputs including system messages
      const input = createUserContent({ text: prompt });
      const reqBody: any = { model, input };
      if (system) reqBody.system = system;
      const resp = await ai.responses.create(reqBody);
      // Extract text from common shapes
      const reply = resp?.outputText ?? resp?.reply?.parts?.map((p: any) => p.text || '').join('') ?? JSON.stringify(resp);
      return NextResponse.json({ reply, raw: resp });
    }

    // Fallback to models.generateContent if responses.create is not available
    if (ai.models && typeof ai.models.generateContent === 'function') {
      const contents = createUserContent({ text: prompt });
      const resp = await ai.models.generateContent({ model, contents, system });
      const reply = resp?.outputText || resp?.candidates?.[0]?.content || JSON.stringify(resp);
      
      return NextResponse.json({ reply, raw: resp });
    }

    return NextResponse.json({ error: 'No suitable SDK method available' }, { status: 500 });
  } catch (err: any) {
    console.error('Gemini SDK call failed', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
