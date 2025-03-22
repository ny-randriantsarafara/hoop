export interface Season {
  readonly id: string;
  readonly label: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly active: boolean;
}
