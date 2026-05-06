export default function Footer() {
  return (
    <footer className="border-t border-brand-primary/15 py-6 mt-8 mb-16 md:mb-0">
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} VoIP Kamailio Web Client
        </p>
        <p className="text-xs text-gray-300">
          Powered by Next.js 14 · SIP.js · Supabase · Kamailio
        </p>
      </div>
    </footer>
  );
}
