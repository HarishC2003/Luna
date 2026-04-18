import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
      <div className="mb-8">
        <h1 className="text-5xl font-black tracking-tight text-[#E85D9A] italic">Luna</h1>
      </div>
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl border border-[#E85D9A]/10">
        <h2 className="text-2xl font-bold text-[#4A1B3C] mb-4">Under Maintenance</h2>
        <p className="text-gray-600 mb-8">
          Luna is currently under maintenance. We are making sure everything is running smoothly and will be back shortly!
        </p>
      </div>
      <Link href="/login" className="mt-8 text-xs text-gray-400 hover:text-[#E85D9A] transition-colors">
        Admin? Sign in here
      </Link>
    </div>
  );
}
