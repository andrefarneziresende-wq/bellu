'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Camera,
  DollarSign,
  UserPlus,
  Star,
  Megaphone,
  Settings,
  Shield,
  Bell,
  Package,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

// Each nav item maps to the permissions needed to see it
// Empty array = always visible; '*' check handled by hasAnyPermission
const navigation = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard, permissions: [] },
  { key: 'agenda', href: '/agenda', icon: Calendar, permissions: ['agenda.view'] },
  { key: 'clients', href: '/clients', icon: Users, permissions: ['clients.view'] },
  { key: 'services', href: '/services', icon: Scissors, permissions: ['services.view'] },
  { key: 'packages', href: '/packages', icon: Package, permissions: ['services.view'] },
  { key: 'portfolio', href: '/portfolio', icon: Camera, permissions: ['portfolio.view'] },
  { key: 'finances', href: '/finances', icon: DollarSign, permissions: ['finances.view'] },
  { key: 'team', href: '/team', icon: UserPlus, permissions: ['team.view'] },
  { key: 'roles', href: '/roles', icon: Shield, permissions: ['roles.view'] },
  { key: 'reviews', href: '/reviews', icon: Star, permissions: ['reviews.view'] },
  { key: 'promotions', href: '/promotions', icon: Megaphone, permissions: ['promotions.view'] },
  { key: 'conversations', href: '/conversations', icon: MessageSquare, permissions: [] },
  { key: 'notifications', href: '/notifications', icon: Bell, permissions: [] },
  { key: 'settings', href: '/settings', icon: Settings, permissions: ['settings.view'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { proContext, hasAnyPermission } = useAuth();

  // Filter navigation items based on permissions
  const visibleNav = navigation.filter((item) => {
    if (item.permissions.length === 0) return true; // Always visible
    return hasAnyPermission(item.permissions);
  });

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <img src="/logo.png" alt="Bellu" className="h-8 w-auto" />
        <span className="font-serif text-lg font-bold text-sidebar-foreground">
          Pro
        </span>
      </div>

      {/* Role badge */}
      {proContext && (
        <div className="mx-3 mt-3 rounded-lg bg-muted px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">{proContext.businessName}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {proContext.type === 'owner' ? '👑 ' : ''}
            {proContext.roleName}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNav.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(`proDashboard.sidebar.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">Bellu Pro v0.1.0</p>
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
