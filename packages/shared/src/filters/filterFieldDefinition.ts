export type FilterFieldType = 'text' | 'select' | 'date' | 'enum';

export interface FilterFieldOption {
  readonly value: string;
  readonly label: string;
}

export interface FilterFieldDefinition {
  readonly key: string;
  readonly label: string;
  readonly type: FilterFieldType;
  readonly options?: ReadonlyArray<FilterFieldOption>;
  readonly placeholder?: string;
}
