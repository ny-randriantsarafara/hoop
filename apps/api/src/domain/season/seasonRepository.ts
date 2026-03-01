import type { SeasonEntity } from './seasonEntity';

export interface SeasonRepository {
  findById(id: string): Promise<SeasonEntity | null>;
  findActive(): Promise<SeasonEntity | null>;
  findAll(): Promise<SeasonEntity[]>;
  create(input: {
    readonly label: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly active: boolean;
  }): Promise<SeasonEntity>;
  update(
    id: string,
    input: Partial<{
      readonly label: string;
      readonly startDate: Date;
      readonly endDate: Date;
      readonly active: boolean;
    }>,
  ): Promise<SeasonEntity>;
  delete(id: string): Promise<void>;
  deactivateAll(): Promise<void>;
}
