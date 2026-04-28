import { ChatMessage } from '@/types/chat';
import { TypingIndicator } from './TypingIndicator';
import { CrisisResourceCard } from './CrisisResourceCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatBubble({ message, isOwn }: { message: ChatMessage, isOwn: boolean }) {
  const isLuna = !isOwn;

  return (
    <div className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {isLuna && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E85D9A] to-[#D93F7D] text-white flex-shrink-0 flex items-center justify-center font-bold text-sm mr-2 mt-auto mb-1">
          L
        </div>
      )}
      
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] group ${isOwn ? 'items-end' : 'items-start'}`}>
         <div 
           className={`px-4 py-3 shadow-sm text-[15px] leading-relaxed ${
             message.isCrisis 
               ? 'bg-amber-50 text-amber-900 rounded-2xl rounded-bl-none border border-amber-200'
               : isOwn 
                 ? 'bg-[#E85D9A] text-white rounded-2xl rounded-br-none' 
                 : 'bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-100'
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
                   table: ({...props}) => <div className="overflow-x-auto my-2"><table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg text-sm" {...props} /></div>,
                   th: ({...props}) => <th className="px-3 py-2 bg-gray-50 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200" {...props} />,
                   td: ({...props}) => <td className="px-3 py-2 text-sm border-t border-gray-200 text-gray-700" {...props} />,
                   a: ({...props}) => <a className="text-[#E85D9A] underline hover:text-[#D93F7D]" {...props} />,
                   ul: ({...props}) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                   ol: ({...props}) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
                   li: ({...props}) => <li className="text-sm" {...props} />,
                   p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                   strong: ({...props}) => <strong className="font-bold text-inherit" {...props} />,
                   h1: ({...props}) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                   h2: ({...props}) => <h2 className="text-lg font-bold mb-2 mt-4" {...props} />,
                   h3: ({...props}) => <h3 className="text-md font-bold mb-2 mt-3" {...props} />,
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
         
         <div suppressHydrationWarning className={`text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
           {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>
    </div>
  );
}
