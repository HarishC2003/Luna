import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chatLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { sanitizeChatInput, stripPII } from '@/lib/chat/pii-stripper';
import { detectCrisis } from '@/lib/chat/crisis-detector';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';
import { buildUserHealthContext, formatContextForPrompt } from '@/lib/chat/context-builder';

export const maxDuration = 60;

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']).transform(v => v === 'assistant' ? 'model' : 'user'),
    content: z.string().max(4000)
  })).max(10), // capped to max last 10 turns
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
    const { cleaned } = stripPII(sanitizedMsg);
    
    // Fetch and build context
    let formattedContext = '';
    try {
      const userContext = await buildUserHealthContext(user.id);
      formattedContext = formatContextForPrompt(userContext);
    } catch (ctxErr) {
      console.error('Context Building Error:', ctxErr);
      // Fallback to empty context so chat doesn't fully break
      formattedContext = "No history available.";
    }

    const systemPrompt = buildSystemPrompt(formattedContext);

    const apiKey = process.env.GEMINI_API_KEY!;
    if (!apiKey) {
       console.error('GEMINI_API_KEY is missing from environment variables.');
       return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Updated to recommended model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: systemPrompt });

    // Ensure roles are user or model
    const geminiHistory = history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: sanitizeChatInput(h.content) || ' ' }]
    }));

    // Merge consecutive messages from same role if needed (Gemini strict alternating role requirement)
    const validHistory: { role: string; parts: { text: string }[] }[] = [];
    for (const msg of geminiHistory) {
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === msg.role) {
         validHistory[validHistory.length - 1].parts[0].text += '\n\n' + msg.parts[0].text;
      } else {
         validHistory.push(msg);
      }
    }
    if (validHistory.length > 0 && validHistory[0].role === 'model') {
       validHistory.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    // Ensure the last message in history is NOT from the user, because we are about to send a user message.
    if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
       validHistory.push({ role: 'model', parts: [{ text: 'Okay, tell me more.' }] });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chatSession = model.startChat({
            history: validHistory,
          });
          const result = await chatSession.sendMessageStream(cleaned);
          for await (const chunk of result.stream) {
             const text = chunk.text();
             if (text) {
                const payload = `data: ${JSON.stringify({ type: 'delta', text })}\n\n`;
                controller.enqueue(encoder.encode(payload));
             }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
             // client disconnect
          } else {
             console.error('Gemini Stream Error:', error);
             controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'The AI service is currently overwhelmed. Please try again in a moment.' })}\n\n`));
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { 
        headers: { 
            'Content-Type': 'text/event-stream', 
            'Cache-Control': 'no-cache, no-transform', 
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        } 
    });

  } catch(error: unknown) {
    console.error('Message POST Error:', error);
    if (error instanceof Error && (error.message?.includes('high demand') || (error as unknown as { status?: number }).status === 503)) {
       return NextResponse.json({ error: 'The AI model is experiencing high demand. Please try again in a few seconds.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Something went wrong on our end.' }, { status: 500 });
  }
}
