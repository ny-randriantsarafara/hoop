import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { TemplateUploadFlow } from '@/features/templates/ui/TemplateUploadFlow';

export default function TemplateUploadPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Templates', href: '/templates' }, { label: 'Upload' }]} />
      <TemplateUploadFlow />
    </div>
  );
}
