import { NavBar } from '@/components/landing/NavBar';
import { PhaseRing } from '@/components/landing/PhaseRing';
import { ProductStrip } from '@/components/landing/ProductStrip';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white text-[#4A1B3C] selection:bg-[#E85D9A] selection:text-white flex flex-col font-sans">
      <NavBar />

      <main className="flex-1 w-full pt-20">
        {/* HERO SECTION */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h1 className="text-[40px] leading-tight font-medium text-[#4A1B3C] tracking-tight">
              Your cycle, understood.
            </h1>
            <p className="text-[18px] text-[#72243E] mt-3 max-w-[480px]">
              Track periods, decode symptoms, and chat with an AI that knows your body — privately and personally.
            </p>
            
            <Link 
              href="/register" 
              className="mt-8 bg-[#E85D9A] text-white px-8 py-[14px] rounded-full font-medium text-lg hover:bg-[#d44d88] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E85D9A] inline-flex items-center gap-2 w-full md:w-auto justify-center"
            >
              Start tracking free
            </Link>
            
            <div className="mt-4 text-[12px] text-gray-400 flex items-center justify-center md:justify-start gap-2 max-w-full">
              <span>No credit card</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>Private by default</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>Works on any device</span>
            </div>
          </div>

          <div className="relative py-8 md:py-0 select-none pointer-events-none">
             <PhaseRing />
          </div>
        </section>

        {/* SOCIAL PROOF BAR */}
        <section className="bg-[#FBEAF0] py-4 w-full overflow-hidden whitespace-nowrap">
          <div className="flex justify-center items-center gap-3 px-4 min-w-max mx-auto text-sm text-[#4A1B3C] font-medium">
             Trusted by 10,000+ women
             <span className="text-[#E85D9A] mx-2 flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
             </span>
             4.9 stars
             <span className="mx-3 text-[#E85D9A] font-light">|</span>
             100% private
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-20">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="flex flex-col gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-[#E85D9A]/10 flex items-center justify-center text-[#E85D9A]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <circle cx="12" cy="15" r="2" fill="currentColor" />
                </svg>
              </div>
              <h3 className="text-[16px] font-medium text-[#4A1B3C]">Predict your cycle</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                Luna learns from your history and predicts your next period, fertile window, and ovulation day — getting more accurate every month.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center text-[#8b5cf6]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-[16px] font-medium text-[#4A1B3C]">Chat with Luna AI</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                Ask anything — what to eat, why you feel tired, whether your symptoms are normal. Luna knows your cycle data and gives personalised answers.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-[16px] font-medium text-[#4A1B3C]">Private by design</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                Your health data never trains AI models. Conversations are ephemeral. You can export or delete everything in one tap.
              </p>
            </div>
          </div>
        </section>

        {/* MOCKUPS CAROUSEL */}
        <ProductStrip />

        {/* TESTIMONIALS */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#4A1B3C]">Loved by women everywhere</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#FDF8F9] p-6 rounded-2xl border border-[#E85D9A]/10">
              <p className="text-[14px] italic text-[#4A1B3C]/80 mb-6">"Luna told me my cramps would start 2 days before my period and exactly that happened. It's scary accurate now."</p>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#E85D9A] text-white flex items-center justify-center text-xs font-bold">PM</div>
                 <div className="text-[12px] text-gray-500 font-medium">— Priya M., Mumbai</div>
              </div>
            </div>

            <div className="bg-[#FDF8F9] p-6 rounded-2xl border border-[#E85D9A]/10">
              <p className="text-[14px] italic text-[#4A1B3C]/80 mb-6">"I asked Luna why I always feel anxious before my period. It explained the luteal phase in a way that actually made sense for my body."</p>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#E85D9A] text-white flex items-center justify-center text-xs font-bold">AT</div>
                 <div className="text-[12px] text-gray-500 font-medium">— Anika T., Bengaluru</div>
              </div>
            </div>

            <div className="bg-[#FDF8F9] p-6 rounded-2xl border border-[#E85D9A]/10">
              <p className="text-[14px] italic text-[#4A1B3C]/80 mb-6">"Finally an app that doesn't share my data. The privacy dashboard showed me exactly what's stored and nothing else."</p>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#E85D9A] text-white flex items-center justify-center text-xs font-bold">RA</div>
                 <div className="text-[12px] text-gray-500 font-medium">— Reem A., Dubai</div>
              </div>
            </div>
          </div>
        </section>

        {/* PRIVACY PROMISE BLOCK */}
        <section className="bg-[#4A1B3C] text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <h2 className="text-[28px] font-medium mb-8">Your health data is yours. Always.</h2>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="px-4 py-2 rounded-full border border-[#E85D9A] text-sm font-medium">Never sold</div>
              <div className="px-4 py-2 rounded-full border border-[#E85D9A] text-sm font-medium">Not used to train AI</div>
              <div className="px-4 py-2 rounded-full border border-[#E85D9A] text-sm font-medium">Delete in one tap</div>
            </div>
            
            <p className="text-[14px] opacity-60 max-w-2xl leading-relaxed mb-8">
              Luna is built on a simple principle: your menstrual health data is some of the most personal information about you. We built the architecture to ensure even we can't read it.
            </p>
            
            <Link href="/privacy" className="text-[#E85D9A] hover:text-white underline underline-offset-4 text-sm font-medium transition-colors">
              Read our privacy design →
            </Link>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 px-4 text-center">
           <h2 className="text-3xl font-bold text-[#4A1B3C] mb-3">Know your body better, starting today.</h2>
           <p className="text-gray-500 mb-8 font-medium">Free forever. No credit card needed.</p>
           
           <div className="flex flex-col items-center gap-4">
             <Link 
                href="/register" 
                className="bg-[#E85D9A] text-white px-8 py-[14px] rounded-full font-medium text-lg hover:bg-[#d44d88] transition-colors shadow-lg hover:shadow-xl w-full max-w-[280px]"
              >
                Start tracking free
              </Link>
              <Link href="/login" className="text-[#4A1B3C]/70 hover:text-[#4A1B3C] text-sm font-medium transition-colors">
                Already have an account? Sign in →
              </Link>
           </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#FDF8F9] pt-16 pb-8 px-4 md:px-6 border-t border-[#E85D9A]/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="font-bold text-xl text-[#4A1B3C] flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12" stroke="#E85D9A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Luna
              </Link>
              <p className="text-sm text-[#4A1B3C]/70 max-w-[200px] mb-4">
                Your private AI-powered cycle companion.
              </p>
              {/* Placeholder Socials */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E85D9A]/10 flex items-center justify-center text-[#E85D9A]"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></div>
                <div className="w-8 h-8 rounded-full bg-[#E85D9A]/10 flex items-center justify-center text-[#E85D9A]"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-sm text-[#4A1B3C]">Product</h4>
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-[#E85D9A] transition-colors w-fit">Dashboard</Link>
              <Link href="/chat" className="text-sm text-gray-500 hover:text-[#E85D9A] transition-colors w-fit">Chat AI</Link>
              <Link href="/cycles" className="text-sm text-gray-500 hover:text-[#E85D9A] transition-colors w-fit">Cycle Tracker</Link>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-sm text-[#4A1B3C]">Company</h4>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-[#E85D9A] transition-colors w-fit">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-[#E85D9A] transition-colors w-fit">Terms of Service</Link>
              <Link href="mailto:support@lunaapp.com" className="text-sm text-gray-500 hover:text-[#E85D9A] transition-colors w-fit">Contact</Link>
            </div>

            <div className="flex flex-col gap-3">
               <h4 className="font-bold text-sm text-[#4A1B3C]">Resources</h4>
              <Link href="#" className="text-sm text-gray-500 hover:text-[#E85D9A] transition-colors w-fit">How it works</Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-[#E85D9A] transition-colors w-fit">About PCOS</Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-[#E85D9A] transition-colors w-fit">About endometriosis</Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#E85D9A]/10 text-xs text-gray-400 gap-4">
             <p>© 2025 Luna. Made with care for women's health.</p>
             <div className="flex gap-6">
                <Link href="/privacy" className="hover:text-[#E85D9A] transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-[#E85D9A] transition-colors">Terms</Link>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
