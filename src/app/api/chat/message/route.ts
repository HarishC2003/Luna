import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chatLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { sanitizeChatInput, stripPII } from '@/lib/chat/pii-stripper';
import { detectCrisis } from '@/lib/chat/crisis-detector';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';

export const maxDuration = 60;

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']).transform(v => v === 'assistant' ? 'model' : 'user'),
    content: z.string().max(4000)
  })).max(20),
  sessionId: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
             try {
                cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
             } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsedBody = chatSchema.safeParse(body);
    
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }

    const { message: rawMessage, history, sessionId } = parsedBody.data;

    // Chat rate limiting
    const rateLimit = await chatLimiter.limit(user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "You've had a lot of conversations today. Take a little break and come back soon.", retryAfter: rateLimit.reset },
        { status: 429 }
      );
    }

    const sanitizedMsg = sanitizeChatInput(rawMessage);
    if (!sanitizedMsg) {
      return NextResponse.json({ error: "Message is too short or contains no readable text" }, { status: 400 });
    }

    // Crisis detection
    const crisis = detectCrisis(rawMessage);
    const encoder = new TextEncoder();

    if (crisis.detected) {
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll() { return []; }, setAll() {} } }
      );

      await supabaseAdmin.from('chat_abuse_log').insert({
        user_id: user.id,
        session_id: sessionId,
        reason: `crisis_detected_${crisis.severity}`,
        ip_address: getRealIP(request)
      });

      return new Response(
        new ReadableStream({
          start(controller) {
            const sendDelta = (text: string) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text, isCrisis: true })}\n\n`));
            };

            sendDelta("I can hear that you're going through something really difficult. Please know you're not alone. Before we talk further, I want to make sure you have these support resources:\n\n");
            
            crisis.resources.forEach(r => {
               sendDelta(`• ${r.name}: ${r.number} (${r.available})\n`);
            });
            
            sendDelta("\nI'm here with you. Would you like to talk about what you're feeling?");
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          }
        }), { headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    // PII Stripping
    const { cleaned, strippedFields } = stripPII(sanitizedMsg);
    
    // Fetch context
    const [predictionRes, onboardingRes, logsRes] = await Promise.all([
      supabase.from('cycle_predictions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('daily_logs').select('symptoms').eq('user_id', user.id).gte('log_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const prediction = predictionRes.data;
    const onboarding = onboardingRes.data;
    const logs = logsRes.data || [];

    const symCounts: Record<string, number> = {};
    logs.forEach(log => {
      (log.symptoms || []).forEach((s: string) => { symCounts[s] = (symCounts[s] || 0) + 1; });
    });
    const topSymptoms = Object.entries(symCounts).sort((a,b) => b[1] - a[1]).slice(0,3).map(e => e[0]);

    const systemPrompt = buildSystemPrompt({
      currentPhase: prediction?.current_phase || 'unknown',
      phaseDescription: prediction?.phase_description || 'We need more tracking data.',
      avgCycleLength: onboarding?.avg_cycle_length || 28,
      avgPeriodLength: onboarding?.avg_period_length || 5,
      daysUntilNextPeriod: prediction?.days_until_next_period ?? null,
      topSymptoms,
      conditions: onboarding?.conditions || [],
      goals: onboarding?.goals || []
    });

    const apiKey = process.env.GEMINI_API_KEY!;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-2.5-flash as it's the most capable model available on the free tier without the 0-quota limit.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPrompt });

    const contents = history.map(h => ({
      role: h.role,
      parts: [{ text: sanitizeChatInput(h.content) || ' ' }]
    }));

    const validHistory: any[] = [];
    for (const msg of contents) {
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === msg.role) {
         validHistory[validHistory.length - 1].parts[0].text += '\n\n' + msg.parts[0].text;
      } else {
         validHistory.push(msg);
      }
    }
    if (validHistory.length > 0 && validHistory[0].role === 'model') {
       validHistory.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const chatSession = model.startChat({
        history: validHistory,
        generationConfig: { maxOutputTokens: 1000 }
    });

    // Provide AbortSignal handling since client might disconnect
    const streamResponse = await chatSession.sendMessageStream(cleaned);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResponse.stream) {
             const text = chunk.text();
             if (text) {
                const payload = `data: ${JSON.stringify({ type: 'delta', text })}\n\n`;
                controller.enqueue(encoder.encode(payload));
             }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        } catch (error: any) {
          if (error.name === 'AbortError') {
             // client disconnect
          } else {
             console.error('Gemini Stream Error:', error);
             controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Something went wrong. Please try again.' })}\n\n`));
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });

  } catch(error) {
    console.error('Message POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
