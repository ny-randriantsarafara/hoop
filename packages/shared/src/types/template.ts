export interface Template {
  readonly id: string;
  readonly clubId: string;
  readonly name: string;
  readonly description: string | null;
  readonly format: 'xlsx' | 'docx';
  readonly placeholders: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
}
