export function ProductStrip() {
  return (
    <div className="w-full overflow-hidden bg-gray-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#4A1B3C]">A beautifully simple experience</h2>
        </div>
        
        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar gap-6 md:gap-8 justify-start md:justify-center">
          
          {/* Screen 1 - Dashboard */}
          <div className="flex-none w-[280px] h-[500px] bg-white rounded-[32px] shadow-xl border-4 border-gray-100 relative overflow-hidden snap-center flex flex-col">
            {/* Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-100 rounded-b-xl z-20"></div>
            
            {/* Header */}
            <div className="pt-10 px-5 pb-4 bg-[#FDF8F9] border-b border-[#E85D9A]/10">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#4A1B3C] text-lg">Luna</span>
                <div className="w-6 h-6 rounded-full bg-[#E85D9A]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#E85D9A]"></div>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-5 scroll-y-auto">
              {/* Phase Card */}
              <div className="bg-white border text-center border-[#E85D9A]/20 p-4 rounded-2xl mb-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#E85D9A]"></div>
                <div className="text-sm text-gray-500 font-medium">Day 18</div>
                <div className="text-xl font-bold text-[#4A1B3C] mt-1">Luteal Phase</div>
                <div className="text-xs text-[#E85D9A] mt-2 font-medium">10 days until next period</div>
              </div>

              {/* Mini Calendar Grid */}
              <div className="mb-6">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-2 px-1">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Simulated empty days */}
                  <div className="h-8"></div><div className="h-8"></div>
                  {/* Past days */}
                  {[1,2,3,4,5].map(i => <div key={i} className="h-8 rounded-full bg-[#E85D9A]/20 flex justify-center items-center text-[10px] text-[#E85D9A] font-bold">{i}</div>)}
                  {[6,7,8,9,10,11,12].map(i => <div key={i} className="h-8 rounded-full flex justify-center items-center text-[10px] text-gray-400">{i}</div>)}
                  {[13,14,15,16,17].map(i => <div key={i} className="h-8 rounded-full bg-[#14b8a6]/10 flex justify-center items-center text-[10px] text-[#14b8a6] font-bold">{i}</div>)}
                  {/* Today */}
                  <div className="h-8 rounded-full bg-[#4A1B3C] flex justify-center items-center text-[10px] text-white font-bold ring-2 ring-offset-1 ring-[#4A1B3C]">18</div>
                  {/* Future */}
                  {[19,20,21,22].map(i => <div key={i} className="h-8 rounded-full flex justify-center items-center text-[10px] text-gray-400">{i}</div>)}
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full bg-[#FDF8F9] border border-[#E85D9A]/30 text-[#E85D9A] font-bold py-3 rounded-xl text-sm justify-center flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Log today's symptoms
              </button>
            </div>
          </div>

          {/* Screen 2 - Chat */}
          <div className="flex-none w-[280px] h-[500px] bg-white rounded-[32px] shadow-xl border-4 border-gray-100 relative overflow-hidden snap-center flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-100 rounded-b-xl z-20"></div>
            
            <div className="pt-10 px-5 pb-3 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4A1B3C] text-white flex items-center justify-center font-bold text-sm">L</div>
              <div>
                <div className="font-bold text-[#4A1B3C] text-sm leading-tight">Luna AI</div>
                <div className="text-[10px] text-green-500">Online</div>
              </div>
            </div>

            <div className="flex-1 p-4 bg-gray-50 overflow-hidden flex flex-col justify-end gap-4">
              <div className="self-end bg-[#E85D9A] text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-[13px] shadow-sm">
                I have bad cramps today
              </div>
              <div className="self-start bg-white border border-gray-100 text-[#4A1B3C] p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-[13px] shadow-sm">
                You're on day 2 — that's peak cramping time. Try a heat pad on your lower back and ibuprofen if you can take it. How heavy is the flow?
              </div>
              <div className="self-end bg-[#E85D9A] text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-[13px] shadow-sm">
                Pretty heavy
              </div>
            </div>

            <div className="p-3 bg-white border-t border-gray-100">
               <div className="bg-gray-100 rounded-full h-10 px-4 flex items-center">
                 <span className="text-gray-400 text-xs">Message Luna...</span>
               </div>
            </div>
          </div>

          {/* Screen 3 - Insights */}
          <div className="flex-none w-[280px] h-[500px] bg-white rounded-[32px] shadow-xl border-4 border-gray-100 relative overflow-hidden snap-center flex flex-col">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-100 rounded-b-xl z-20"></div>
             
             <div className="pt-10 px-5 pb-4 bg-[#4A1B3C]">
                <h3 className="font-bold text-white text-lg">Your Insights</h3>
             </div>

             <div className="flex-1 p-4 bg-gray-50 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                   <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center mb-3">
                     <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                   </div>
                   <div className="text-sm font-bold text-[#4A1B3C] mb-1">Your cycle is 28 days on average</div>
                   <div className="text-xs text-gray-500">Based on your last 6 months of data, your cycle has remained very consistent.</div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                   <div className="w-8 h-8 rounded-full bg-[#E85D9A]/10 flex items-center justify-center mb-3">
                     <svg className="w-4 h-4 text-[#E85D9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                   </div>
                   <div className="text-sm font-bold text-[#4A1B3C] mb-1">Cramps chart</div>
                   <div className="text-xs text-gray-500 mb-3">Cramps most common on days 1–2 for you.</div>
                   
                   {/* Mini bar chart */}
                   <div className="flex items-end h-16 gap-2 justify-center pb-2">
                     <div className="w-4 bg-[#E85D9A] rounded-t-sm" style={{height: '90%'}}></div>
                     <div className="w-4 bg-[#E85D9A] rounded-t-sm" style={{height: '70%'}}></div>
                     <div className="w-4 bg-[#E85D9A]/30 rounded-t-sm" style={{height: '10%'}}></div>
                     <div className="w-4 bg-gray-200 rounded-t-sm" style={{height: '5%'}}></div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
