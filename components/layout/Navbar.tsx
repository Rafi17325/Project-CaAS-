"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Phone, ClipboardList, User, LayoutDashboard, LogOut, Wifi } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/dialpad', label: 'Dial Pad', icon: Phone },
  { href: '/dashboard/call-log', label: 'Call Log', icon: ClipboardList },
  { href: '/dashboard/about', label: 'About', icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // TODO: supabase.auth.signOut()
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-brand-primary/15 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <Wifi size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-gray-900 text-sm tracking-tight">
            VoIP Kamailio
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-gray-500 hover:text-brand-primary hover:bg-brand-light'
                }`}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
        >
          <LogOut size={15} />
          <span className="hidden md:inline">Keluar</span>
        </button>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-brand-primary/15 flex z-50">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
                active ? 'text-brand-primary' : 'text-gray-400'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
