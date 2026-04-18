import { ChatMessage } from '@/types/chat';
import { TypingIndicator } from './TypingIndicator';
import { CrisisResourceCard } from './CrisisResourceCard';

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
           ) : (
             <div className="whitespace-pre-wrap break-words">
               {message.content}
               {message.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-[#E85D9A] animate-pulse align-middle" />}
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
         
         <div className={`text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
           {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>
    </div>
  );
}
