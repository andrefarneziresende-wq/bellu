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
  Image,
  Bell,
  Shield,
  ShieldCheck,
  Settings,
  FileText,
  Radio,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

const navigation = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'professionals', href: '/professionals', icon: UserCheck },
  { key: 'users', href: '/customers', icon: Users },
  { key: 'bookings', href: '/bookings', icon: Calendar },
  { key: 'finances', href: '/finances', icon: DollarSign },
  { key: 'reviews', href: '/reviews', icon: Star },
  { key: 'categories', href: '/categories', icon: Grid3X3 },
  { key: 'services', href: '/services', icon: Scissors },
  { key: 'promotions', href: '/promotions', icon: Megaphone },
  { key: 'banners', href: '/banners', icon: Image },
  { key: 'notifications', href: '/notifications', icon: Bell },
  { key: 'pushLogs', href: '/push-logs', icon: Radio },
  { key: 'admins', href: '/admin-users', icon: Shield },
  { key: 'roles', href: '/admin-roles', icon: ShieldCheck },
  { key: 'settings', href: '/settings', icon: Settings },
  { key: 'legal', href: '/legal', icon: FileText },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo + close button */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Bellu" className="h-8 w-auto" />
          <span className="font-serif text-lg font-bold text-sidebar-foreground">
            Admin
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-sidebar-foreground hover:bg-muted lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(`adminPanel.sidebar.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">Bellu v0.1.0</p>
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
