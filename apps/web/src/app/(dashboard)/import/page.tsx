'use client';

import { Permission, FeatureKey } from '@hoop/shared';
import { ImportFlow } from '@/features/ocr/ui/import-flow';
import { RequirePermission } from '@/shared/ui/require-permission';

export default function ImportPage() {
  return (
    <RequirePermission permission={Permission.ImportUse} featureKey={FeatureKey.OcrImport}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Document Import</h1>
        <ImportFlow />
      </div>
    </RequirePermission>
  );
}
