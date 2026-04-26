import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt || '';
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

    // Example proxy to Google Gemini REST endpoint. Adjust model name and request shape to match
    // the Google Cloud AI API you intend to use.
    const endpoint = 'https://gemini.googleapis.com/v1/models/text-bison-001:predict';

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    const data = await resp.json();
    // Normalize response shape for the client
    const reply = data?.prediction || data?.output || data?.candidates?.[0]?.content || JSON.stringify(data);
    return NextResponse.json({ reply, raw: data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
