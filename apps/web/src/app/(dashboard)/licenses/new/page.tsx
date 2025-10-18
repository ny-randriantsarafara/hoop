'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LicenseForm } from '@/features/licenses/ui/LicenseForm';
import { LicenseBatchForm } from '@/features/licenses/ui/LicenseBatchForm';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { Button } from '@/shared/ui/button';

export default function NewLicensePage() {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId') ?? undefined;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Licenses', href: '/licenses' },
          { label: 'New License' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold">New License</h1>
        <p className="text-muted-foreground">
          Enter license details received from the federation
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === 'single' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('single')}
        >
          Single Entry
        </Button>
        <Button
          variant={mode === 'batch' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('batch')}
        >
          Batch Entry
        </Button>
      </div>

      {mode === 'single' ? (
        <LicenseForm defaultPlayerId={playerId} />
      ) : (
        <LicenseBatchForm />
      )}
    </div>
  );
}
