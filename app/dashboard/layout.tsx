"use client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="py-10">
        {children}
      </main>
    </div>
  );
} 