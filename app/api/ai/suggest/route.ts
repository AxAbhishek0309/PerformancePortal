import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/suggest
 * Body: { role, department, thrustArea, existingGoals }
 * Returns: { suggestions: string[], source: 'groq' | 'mock' }
 *
 * Uses Groq (llama-3.3-70b-versatile) if GROQ_API_KEY is set,
 * otherwise returns smart mock suggestions.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { role, department, thrustArea, existingGoals = [] } = body;

  if (process.env.GROQ_API_KEY) {
    try {
      const prompt = `You are an expert HR performance coach. Generate exactly 3 specific, measurable goal title suggestions for:
- Role: ${role}
- Department: ${department}
- Thrust Area: ${thrustArea}
- Existing goals (avoid duplicates): ${existingGoals.length > 0 ? existingGoals.map((g: string) => `"${g}"`).join(', ') : 'none'}

Rules:
- Each title must be under 12 words
- Must be specific and measurable (include a number or metric)
- Must be achievable within 2025-2026
- Return ONLY a valid JSON array of 3 strings, no explanation, no markdown

Example: ["Reduce API latency to 150ms by Q3 2025", "Achieve 95% test coverage by Q2 2025", "Launch 2 new product features in H1 2025"]`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content: string = data.choices?.[0]?.message?.content ?? '[]';
        // Extract JSON array from response (handle markdown code blocks)
        const match = content.match(/\[[\s\S]*\]/);
        const suggestions = match ? JSON.parse(match[0]) : [];
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return NextResponse.json({ suggestions, source: 'groq' });
        }
      }
    } catch (err) {
      console.error('Groq API error:', err);
      // Fall through to mock
    }
  }

  // Smart mock suggestions by thrust area
  const MOCK: Record<string, string[]> = {
    'Revenue Growth': [
      'Close $2M ARR from new enterprise logos by Q4 2025',
      'Increase upsell revenue by 30% through expansion plays',
      'Launch 2 new pricing tiers to capture mid-market by Q3 2025',
    ],
    'Cost Optimization': [
      'Reduce cloud infrastructure spend by 20% via right-sizing by Q2 2025',
      'Cut vendor costs by $150K through contract renegotiation in H1 2025',
      'Automate 3 manual processes saving 40 engineering hours per month',
    ],
    'Customer Success': [
      'Achieve 95% CSAT score across all support channels by Q4 2025',
      'Reduce average onboarding time from 5 hours to 2 hours by Q3 2025',
      'Increase NPS from 38 to 55 by December 2025',
    ],
    'Innovation': [
      'Ship 4 AI-powered features to production by Q3 2025',
      'Complete microservices migration for 3 core modules by Q2 2025',
      'Reduce feature time-to-market from 6 weeks to 3 weeks by Q4 2025',
    ],
    'Operational Excellence': [
      'Achieve 99.9% uptime SLA across all production services in 2025',
      'Raise unit test coverage from 65% to 90% by Q3 2025',
      'Maintain zero critical security vulnerabilities throughout 2025',
    ],
  };

  const suggestions = MOCK[thrustArea] ?? MOCK['Operational Excellence'];
  return NextResponse.json({ suggestions, source: 'mock' });
}
