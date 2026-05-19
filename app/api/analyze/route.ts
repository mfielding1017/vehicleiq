import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({
  topMatches: z.array(z.object({
    make: z.string(),
    model: z.string(),
    yearRange: z.string(),
    confidence: z.number().min(0).max(100),
    reason: z.string()
  })).min(1).max(5),
  bodyStyle: z.string(),
  visibleClues: z.array(z.string()),
  imageQuality: z.string(),
  caution: z.string()
});

async function fileToDataUrl(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString('base64')}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');

    const vehicleType = formData.get('vehicleType');
    const sizeClass = formData.get('sizeClass');
    const viewAngle = formData.get('viewAngle');
    const colorFamily = formData.get('colorFamily');

    const observations = `
    Optional investigator observations:
    Vehicle type: ${vehicleType || 'unknown'}
    Size class: ${sizeClass || 'unknown'}
    View angle: ${viewAngle || 'unknown'}
    Color family: ${colorFamily || 'unknown'}
    `;

    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY.' }, { status: 500 });
    }

    const dataUrl = await fileToDataUrl(image);

    const analyzeOnce = () =>
  generateObject({
    model: openai('gpt-4.1'),
    temperature: 0,
    schema,
    messages: [
      {
        role: 'system',
        content: 'You are a cautious vehicle identification assistant. Never claim certainty.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this vehicle image for year, make, and model identification.

${observations}

Focus ONLY on manufacturer and model design language:
- body shape
- contour/body lines
- roofline
- rear quarter window shape
- window angles
- grille shape
- emblem shape
- headlight shape
- taillight shape
- bumper/fascia design
- wheel/rim style
- trim/chrome placement
- hood proportions
- rear hatch/trunk shape
- OEM color availability
- overall vehicle proportions

Do NOT rely on:
- stickers
- dents
- damage
- dirt
- temporary accessories
- license plates
- reflections

Prioritize visually similar vehicles that investigators commonly confuse in surveillance footage.

Return exactly 5 candidate year/make/model matches ranked from most likely to least likely.

For each candidate include:
- confidence score from 0-100
- body style
- visible supporting features
- short explanation of WHY the vehicle matches

Use cautious investigative language and never claim certainty.`,

          },
          { type: 'image', image: dataUrl }
        ]
      }
    ]
  });

const runs = await Promise.all([
  analyzeOnce(),
  analyzeOnce(),
  analyzeOnce(),
  analyzeOnce(),
  analyzeOnce()
])

const allMatches = runs.flatMap((r) => r.object.topMatches || []);

const grouped = new Map();

for (const match of allMatches) {
  const key = `${match.make} ${match.model}`.toLowerCase();

  if (!grouped.has(key)) {
    grouped.set(key, {
      ...match,
      votes: 1,
      confidenceTotal: match.confidence || 0
    });
  } else {
    const existing = grouped.get(key);
    existing.votes += 1;
    existing.confidenceTotal += match.confidence || 0;
    existing.confidence = Math.round(existing.confidenceTotal / existing.votes);
  }
}

const topMatches = Array.from(grouped.values())
  .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  .slice(0, 5)
  .map(({ votes, confidenceTotal, ...match }) => match);

return NextResponse.json({
  ...runs[0].object,
  topMatches
});
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Vehicle analysis failed.' }, { status: 500 });
  }
}
