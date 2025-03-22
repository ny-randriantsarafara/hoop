export interface Club {
  readonly id: string;
  readonly name: string;
  readonly section: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly logoUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
