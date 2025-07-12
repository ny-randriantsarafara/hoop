import 'next-auth';

declare module 'next-auth' {
  interface User {
    role: string;
    clubId: string | null;
    accessToken: string;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      clubId: string | null;
    };
    accessToken: string;
  }
}
