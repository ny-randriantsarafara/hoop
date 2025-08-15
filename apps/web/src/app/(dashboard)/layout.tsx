import { redirect } from 'next/navigation';
import { auth } from '@/shared/lib/auth';
import { DashboardShell } from '@/widgets/shell/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
