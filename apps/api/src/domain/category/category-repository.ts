export interface CategoryRecord {
  readonly id: string;
  readonly clubId: string;
  readonly name: string;
}

export interface CategoryRepository {
  findById(id: string): Promise<CategoryRecord | null>;
}
