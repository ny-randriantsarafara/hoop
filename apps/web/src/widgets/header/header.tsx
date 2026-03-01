'use client';

import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface HeaderProps {
  readonly onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:h-16 md:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{session?.user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {session?.user?.role?.replace('admin', 'Admin ')}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {session?.user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
