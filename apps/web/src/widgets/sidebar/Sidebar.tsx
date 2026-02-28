'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Award,
  FileSpreadsheet,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/shared/lib/utils';
import { siteConfig } from '@/shared/config/siteConfig';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

const iconMap = {
  LayoutDashboard,
  Users,
  Award,
  FileSpreadsheet,
  FileText,
  Settings,
} as const;

interface SidebarProps {
  readonly onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <Link href="/" className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          H
        </div>
        <span className="text-lg font-semibold">{siteConfig.name}</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {siteConfig.navItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-3 py-4">
        <button
          onClick={() => setSignOutOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        variant="default"
        onConfirm={() => signOut({ callbackUrl: '/login' })}
      />
    </aside>
  );
}
