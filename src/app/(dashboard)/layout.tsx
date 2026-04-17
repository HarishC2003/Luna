export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDF8F9]">
      <nav className="bg-white border-b border-[#E85D9A]/20 px-6 py-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-[#E85D9A]">Luna</span>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-6">
        {children}
      </main>
    </div>
  );
}
