import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { UserForm } from '@/features/users/ui/user-form';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Users', href: '/users' }, { label: 'Edit User' }]} />
      <div>
        <h1 className="text-2xl font-bold">Edit User</h1>
        <p className="text-muted-foreground">Update user account details and password</p>
      </div>
      <UserForm userId={id} />
    </div>
  );
}
