import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { VoipProvider } from '@/lib/voipProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <VoipProvider>
      <div className="min-h-screen flex flex-col bg-[#F4F9F9]">
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </VoipProvider>
  );
}
