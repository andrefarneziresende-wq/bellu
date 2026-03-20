'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Star,
  Grid3X3,
  Scissors,
  Megaphone,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Profissionais', href: '/professionals', icon: UserCheck },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Agendamentos', href: '/bookings', icon: Calendar },
  { name: 'Financeiro', href: '/finances', icon: DollarSign },
  { name: 'Avaliações', href: '/reviews', icon: Star },
  { name: 'Categorias', href: '/categories', icon: Grid3X3 },
  { name: 'Serviços', href: '/services', icon: Scissors },
  { name: 'Promoções', href: '/promotions', icon: Megaphone },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Sparkles className="h-6 w-6 text-brand-rose" />
        <span className="font-serif text-xl font-bold text-sidebar-foreground">
          Bellu Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">Bellu v0.1.0</p>
      </div>
    </aside>
  );
}
