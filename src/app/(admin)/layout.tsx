export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#4A1B3C] text-white px-6 py-4">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold font-mono">Luna Admin</span>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-6">
        {children}
      </main>
    </div>
  );
}
