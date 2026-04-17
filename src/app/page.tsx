import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FDF8F9] flex flex-col items-center justify-center">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E85D9A]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4A1B3C]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-[pulse_6s_infinite] pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-5xl px-6 py-20 mx-auto text-center flex flex-col items-center">
        
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 mb-8 space-x-2 text-sm font-medium text-[#E85D9A] bg-white/50 backdrop-blur-md rounded-full shadow-sm border border-[#E85D9A]/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D9A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E85D9A]"></span>
          </span>
          <span>Luna Module 1 is Live</span>
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-[#4A1B3C] mb-6 drop-shadow-sm">
          Listen to your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E85D9A] to-[#4A1B3C]">
            natural rhythm.
          </span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-[#4A1B3C]/80 mb-10 leading-relaxed">
          The elegant, private, and intelligent period tracker designed to harmonize with your body. Understand your cycle like never before.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-[#E85D9A] to-[#d44d88] rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ring-2 ring-transparent focus:ring-[#E85D9A]/50 outline-none"
          >
            Create an Account
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-[#4A1B3C] bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-[#E85D9A]/20 hover:bg-[#FDF8F9] hover:shadow-md hover:scale-105 transition-all duration-300 ring-2 ring-transparent focus:ring-[#4A1B3C]/20 outline-none"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Subtle Decorative Elements */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-[#4A1B3C]/60 text-sm font-medium">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white/60 shadow-sm flex items-center justify-center text-[#E85D9A]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            Smart Predictions
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white/60 shadow-sm flex items-center justify-center text-[#E85D9A]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            Secure & Private
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white/60 shadow-sm flex items-center justify-center text-[#E85D9A]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            Lightning Fast
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white/60 shadow-sm flex items-center justify-center text-[#E85D9A]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </div>
            Holistic Health
          </div>
        </div>
      </div>
    </div>
  );
}
