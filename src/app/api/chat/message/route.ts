import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { chatLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { sanitizeChatInput, stripPII } from '@/lib/chat/pii-stripper';
import { detectCrisis } from '@/lib/chat/crisis-detector';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';
import { buildUserHealthContext, formatContextForPrompt } from '@/lib/chat/context-builder';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']).transform(v => v === 'assistant' ? 'model' : 'user'),
    content: z.string().max(4000)
  })).max(10),
  sessionId: z.string().uuid().optional()
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
    let formattedContext: unknown = null;
    try {
      const userContext = await buildUserHealthContext(user.id);
      formattedContext = formatContextForPrompt(userContext);
    } catch (ctxErr) {
      console.error('Context Building Error:', ctxErr);
      // Fallback to null context so chat doesn't fully break
    }

    const systemPrompt = buildSystemPrompt(formattedContext);

    const apiKey = process.env.GEMINI_API_KEY!;
    if (!apiKey) {
       console.error('GEMINI_API_KEY is missing from environment variables.');
       return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const logHealthDataTool = {
      name: 'log_health_data',
      description: 'Log the user\'s daily health data to the database for today. Use this when the user says they are experiencing symptoms, a specific mood, or starting their period.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          mood: { type: SchemaType.STRING, description: "Mood: great, good, okay, low, or terrible" },
          energy: { type: SchemaType.INTEGER, description: "Energy level from 1 to 5" },
          flow: { type: SchemaType.STRING, description: "Flow: none, spotting, light, medium, or heavy" },
          symptoms: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Array of symptoms like cramps, headache, etc." },
          notes: { type: SchemaType.STRING, description: "Any extra notes" }
        }
      }
    } as import('@google/generative-ai').FunctionDeclaration;

    // Ensure roles are user or model
    const geminiHistory = history.map(h => ({
      role: h.role,
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

    const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    const MAX_RETRIES = 2;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const createModelAndChat = async () => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        for (const modelName of MODELS) {
          const model = genAI.getGenerativeModel({ 
            model: modelName, 
            systemInstruction: systemPrompt,
            tools: [{ functionDeclarations: [logHealthDataTool] }]
          });
          const chatSession = model.startChat({ history: validHistory });
          try {
            const result = await chatSession.sendMessageStream(cleaned);
            return { chatSession, result };
          } catch (err: unknown) {
            const status = (err as { status?: number }).status;
            if (status === 503 || status === 429) {
              console.warn(`[Chat] ${modelName} unavailable (${status}), attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
              continue;
            }
            throw err;
          }
        }
        // All models failed this round — wait before retrying
        if (attempt < MAX_RETRIES) {
          const delay = (attempt + 1) * 2000; // 2s, 4s
          console.warn(`[Chat] All models busy, retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
      throw new Error('All AI models are currently unavailable. Please try again shortly.');
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const { chatSession, result } = await createModelAndChat();
          
          let hasToolCall = false;
          let callName = '';
          let callArgs: Record<string, unknown> = {};
          let fullAssistantContent = '';

          for await (const chunk of result.stream) {
             const calls = chunk.functionCalls && chunk.functionCalls();
             if (calls && calls.length > 0) {
                hasToolCall = true;
                callName = calls[0].name;
                callArgs = calls[0].args as Record<string, unknown>;
                break;
             }
             
             try {
               const text = chunk.text();
               if (text) {
                  fullAssistantContent += text;
                  const payload = `data: ${JSON.stringify({ type: 'delta', text })}\n\n`;
                  controller.enqueue(encoder.encode(payload));
               }
             } catch (_e) {
               // Ignore if no text
             }
          }

          if (hasToolCall && callName === 'log_health_data') {
             // Let the user know we are doing an action
             controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: '\n\n*Logging your data...*\n\n' })}\n\n`));
             
             const supabaseAdmin = createServerClient(
               process.env.NEXT_PUBLIC_SUPABASE_URL!,
               process.env.SUPABASE_SERVICE_ROLE_KEY!,
               { cookies: { getAll() { return []; }, setAll() {} } }
             );
             
             const today = new Date().toISOString().split('T')[0];
             const { error: dbErr } = await supabaseAdmin.from('daily_logs').upsert({
                user_id: user.id,
                log_date: today,
                mood: callArgs.mood,
                energy: callArgs.energy,
                flow: callArgs.flow,
                symptoms: callArgs.symptoms || [],
                notes: callArgs.notes
             }, { onConflict: 'user_id, log_date' });

             const functionResult = await chatSession.sendMessageStream([{
               functionResponse: {
                 name: callName,
                 response: dbErr ? { success: false, error: dbErr.message } : { success: true, message: 'Logged successfully' }
               }
             }]);

             for await (const chunk of functionResult.stream) {
                try {
                  const text = chunk.text();
                  if (text) {
                    fullAssistantContent += text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`));
                  }
                } catch (_e) {}
             }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));

          // --- Persist messages to database ---
          try {
            const dbAdmin = createAdminClient();
            let finalSessionId = sessionId;

            // Create session if none provided
            if (!finalSessionId) {
              const autoTitle = rawMessage.slice(0, 70) + (rawMessage.length > 70 ? '...' : '');
              const { data: newSession } = await dbAdmin
                .from('chat_sessions')
                .insert({ user_id: user.id, title: autoTitle })
                .select('id')
                .single();
              if (newSession) finalSessionId = newSession.id;
            } else {
              // Update session timestamp and auto-title if it is still 'New Chat'
              const { data: existingSession } = await dbAdmin
                .from('chat_sessions')
                .select('title')
                .eq('id', finalSessionId)
                .eq('user_id', user.id)
                .maybeSingle();

              if (existingSession) {
                const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
                if (existingSession.title === 'New Chat') {
                  updates.title = rawMessage.slice(0, 70) + (rawMessage.length > 70 ? '...' : '');
                }
                await dbAdmin.from('chat_sessions').update(updates).eq('id', finalSessionId);
              }
            }

            if (finalSessionId) {
              // Collect full assistant text
              let fullAssistant = '';
              // We accumulated text in the stream above, but we need it here too.
              // Re-read from the chunks we already sent isn't possible, so we track it.
              // The fullAssistantContent variable is set below via closure.
              fullAssistant = fullAssistantContent;

              await dbAdmin.from('chat_messages').insert([
                { session_id: finalSessionId, user_id: user.id, role: 'user', content: rawMessage },
                { session_id: finalSessionId, user_id: user.id, role: 'assistant', content: fullAssistant, is_crisis: false }
              ]);

              // Send session ID to client so it can track it
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'session_id', sessionId: finalSessionId })}\n\n`));
            }
          } catch (dbErr) {
            console.error('[chat/message] Failed to persist messages:', dbErr);
            // Don't break the chat if DB save fails
          }
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
             // client disconnect
          } else {
             console.error('Chat API Error:', error);
             const isQuotaError = error instanceof Error && error.message.includes('quota');
             const message = isQuotaError 
               ? 'Chat is temporarily unavailable. Please try again in a few minutes.' 
               : (error instanceof Error ? error.message : 'Unknown error');
             
             controller.enqueue(
               encoder.encode(`data: ${JSON.stringify({ 
                 type: 'error', 
                 message: 'Something went wrong. Please try again.',
                 debug: process.env.NODE_ENV === 'development' ? message : undefined 
               })}\n\n`)
             );
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
