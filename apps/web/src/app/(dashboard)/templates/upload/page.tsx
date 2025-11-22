import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { TemplateUploadForm } from '@/features/templates/ui/TemplateUploadForm';

export default function TemplateUploadPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Templates', href: '/templates' },
          { label: 'Upload' },
        ]}
      />
      <TemplateUploadForm />
    </div>
  );
}
