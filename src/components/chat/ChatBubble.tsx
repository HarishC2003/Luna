import { ChatMessage } from '@/types/chat';
import { TypingIndicator } from './TypingIndicator';
import { CrisisResourceCard } from './CrisisResourceCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatBubble({ message, isOwn }: { message: ChatMessage, isOwn: boolean }) {
  const isLuna = !isOwn;

  return (
    <div className={`flex w-full mb-6 ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
      {isLuna && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E85D9A] via-[#D93F7D] to-[#FF8FA3] text-white flex-shrink-0 flex items-center justify-center font-black text-sm mr-3 mt-auto mb-1 shadow-lg shadow-pink-500/30 ring-2 ring-white z-10">
          L
        </div>
      )}
      
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] group ${isOwn ? 'items-end' : 'items-start'}`}>
         <div 
           className={`px-5 py-3.5 shadow-sm text-[15px] leading-relaxed relative ${
             message.isCrisis 
               ? 'bg-amber-50 text-amber-900 rounded-3xl rounded-bl-sm border border-amber-200 shadow-amber-500/10'
               : isOwn 
                 ? 'bg-gradient-to-br from-[#E85D9A] to-[#D93F7D] text-white rounded-3xl rounded-br-sm shadow-md shadow-pink-500/20 font-medium' 
                 : 'bg-white/90 backdrop-blur-sm text-[#4A1B3C] rounded-3xl rounded-bl-sm border border-pink-100 shadow-[0_2px_15px_rgba(232,93,154,0.06)]'
           }`}
         >
           {message.isStreaming && !message.content ? (
             <TypingIndicator />
           ) : message.failed && !message.content ? (
             <div className="text-gray-400 italic text-sm">Couldn&apos;t generate a response.</div>
           ) : (
             <div className="break-words">
               <ReactMarkdown 
                 remarkPlugins={[remarkGfm]}
                 components={{
                   table: ({...props}) => <div className="overflow-x-auto my-3"><table className="min-w-full divide-y divide-gray-200 border border-pink-100 rounded-xl overflow-hidden shadow-sm text-sm" {...props} /></div>,
                   th: ({...props}) => <th className="px-4 py-3 bg-pink-50/50 text-left text-xs font-bold text-[#4A1B3C] uppercase tracking-wider border-b border-pink-100" {...props} />,
                   td: ({...props}) => <td className="px-4 py-3 text-sm border-t border-pink-50 text-[#4A1B3C]/80" {...props} />,
                   a: ({...props}) => <a className="text-white underline font-semibold decoration-white/50 hover:decoration-white transition-all" {...props} />,
                   ul: ({...props}) => <ul className="list-disc pl-6 space-y-1.5 my-3" {...props} />,
                   ol: ({...props}) => <ol className="list-decimal pl-6 space-y-1.5 my-3" {...props} />,
                   li: ({...props}) => <li className="text-[15px] pl-1" {...props} />,
                   p: ({...props}) => <p className="mb-3 last:mb-0" {...props} />,
                   strong: ({...props}) => <strong className="font-extrabold text-inherit" {...props} />,
                   h1: ({...props}) => <h1 className="text-xl font-black mb-3 mt-5 tracking-tight" {...props} />,
                   h2: ({...props}) => <h2 className="text-lg font-extrabold mb-3 mt-5 tracking-tight" {...props} />,
                   h3: ({...props}) => <h3 className="text-[17px] font-bold mb-2 mt-4" {...props} />,
                   code: ({...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-pink-600" {...props} />
                 }}
               >
                 {message.content + (message.isStreaming ? ' █' : '')}
               </ReactMarkdown>
             </div>
           )}

           {message.isCrisis && (
              <div className="mt-3 space-y-2 text-sm">
                 <div className="pt-2 text-amber-800">
                    <p className="font-semibold mb-2 flex items-center gap-1">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                       Support Resources:
                    </p>
                    <CrisisResourceCard resource={{ name: 'iCall (TISS)', number: '9152987821', description: 'Free, confidential counselling', available: 'Mon–Sat 8am–10pm' }} />
                    <CrisisResourceCard resource={{ name: 'Vandrevala Foundation', number: '1860-2662-345', description: '24/7 free mental health support', available: '24/7' }} />
                    <CrisisResourceCard resource={{ name: 'NIMHANS', number: '080-46110007', description: 'National Institute of Mental Health helpline', available: '24/7' }} />
                 </div>
              </div>
           )}
         </div>
         
         <div suppressHydrationWarning className={`text-[10px] text-[#4A1B3C]/40 font-semibold mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider`}>
           {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>
    </div>
  );
}
