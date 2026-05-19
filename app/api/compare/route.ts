import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({
  matchPercentage: z.number().min(0).max(100),
  likelihood: z.enum(['Low', 'Medium', 'High']),
  summary: z.string(),
  matchingFeatures: z.array(z.string()),
  differences: z.array(z.string()),
  imageQualityConcerns: z.array(z.string()),
  recommendedWording: z.string()
});

async function fileToDataUrl(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString('base64')}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const suspect = formData.get('suspect');
    const reference = formData.get('reference');

    if (!(suspect instanceof File) || !(reference instanceof File)) {
      return NextResponse.json({ error: 'Both suspect and reference images are required.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY.' }, { status: 500 });
    }

    const suspectUrl = await fileToDataUrl(suspect);
    const referenceUrl = await fileToDataUrl(reference);

    const result = await generateObject({
      model: openai('gpt-4.1-mini'),
      schema,
      messages: [
        {
          role: 'system',
          content: 'You compare two vehicle photos cautiously. Do not make legal conclusions. Do not say they are definitely the same vehicle. Use terms like visually consistent, possible match, or insufficient evidence.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Compare these two vehicle images. First image is the suspect vehicle. Second image is the possible match. Estimate visual similarity and explain matching/mismatching vehicle features.' },
            { type: 'image', image: suspectUrl },
            { type: 'image', image: referenceUrl }
          ]
        }
      ]
    });

    return NextResponse.json(result.object);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Vehicle comparison failed.' }, { status: 500 });
  }
}
