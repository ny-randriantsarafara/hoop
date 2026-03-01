'use client';

import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface TemplateMetadataFormProps {
  readonly name: string;
  readonly description: string;
  readonly onNameChange: (value: string) => void;
  readonly onDescriptionChange: (value: string) => void;
}

export function TemplateMetadataForm({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: TemplateMetadataFormProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">Name (required)</Label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Federal License Form"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-description">Description</Label>
        <Input
          id="template-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional description"
        />
      </div>
    </div>
  );
}
