'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import type { Permission, FeatureKey } from '@hoop/shared';
import { useAuthorization } from '@/shared/lib/use-authorization';

interface RequirePermissionProps {
  readonly children: ReactNode;
  readonly permission?: Permission;
  readonly featureKey?: FeatureKey;
  readonly fallback?: ReactNode;
  readonly redirectTo?: string;
}

export function RequirePermission({
  children,
  permission,
  featureKey,
  fallback,
  redirectTo = '/',
}: RequirePermissionProps) {
  const router = useRouter();
  const { canAccess, isLoading } = useAuthorization();

  const hasAccess = canAccess(permission, featureKey);

  useEffect(() => {
    if (!isLoading && !hasAccess && !fallback) {
      router.push(redirectTo);
    }
  }, [isLoading, hasAccess, fallback, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}
