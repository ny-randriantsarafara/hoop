'use client';

import { useSession } from 'next-auth/react';
import {
  FeatureKey,
  hasPermission,
  type Permission,
  type FeatureKey as FeatureKeyType,
  type Role,
} from '@hoop/shared';
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/shared/lib/api-client';

interface FeatureFlag {
  key: FeatureKeyType;
  enabled: boolean;
}

interface AuthorizationState {
  isLoading: boolean;
  featureFlags: FeatureFlag[];
}

export function useAuthorization() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<AuthorizationState>({
    isLoading: true,
    featureFlags: [],
  });

  const userRole = (session?.user?.role as Role) ?? null;

  // Fetch feature flags once session is available
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.accessToken) {
      setState({ isLoading: false, featureFlags: [] });
      return;
    }

    const fetchFeatureFlags = async () => {
      try {
        const flags = await apiClient<FeatureFlag[]>('/feature-flags', {
          token: session.accessToken,
        });
        setState({ isLoading: false, featureFlags: flags });
      } catch {
        // If feature flags can't be fetched (e.g., user lacks permission), default to empty
        setState({ isLoading: false, featureFlags: [] });
      }
    };

    fetchFeatureFlags();
  }, [status, session?.accessToken]);

  const can = useCallback(
    (permission: Permission): boolean => {
      if (!userRole) return false;
      return hasPermission(userRole, permission);
    },
    [userRole],
  );

  const isFeatureEnabled = useCallback(
    (featureKey: FeatureKeyType): boolean => {
      const flag = state.featureFlags.find((f) => f.key === featureKey);
      return flag?.enabled ?? featureKey !== FeatureKey.OcrImport;
    },
    [state.featureFlags],
  );

  const canAccess = useCallback(
    (permission?: Permission, featureKey?: FeatureKeyType): boolean => {
      // Check permission if provided
      if (permission && !can(permission)) {
        return false;
      }
      // Check feature flag if provided
      if (featureKey && !isFeatureEnabled(featureKey)) {
        return false;
      }
      return true;
    },
    [can, isFeatureEnabled],
  );

  return {
    isLoading: state.isLoading || status === 'loading',
    userRole,
    can,
    isFeatureEnabled,
    canAccess,
    featureFlags: state.featureFlags,
  };
}
