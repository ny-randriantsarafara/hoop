import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { TemplateBuilder } from '@/features/templates/ui/TemplateBuilder';

export default function TemplateBuilderPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Templates', href: '/templates' },
          { label: 'Create Template' },
        ]}
      />
      <TemplateBuilder />
    </div>
  );
}
