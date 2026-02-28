'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { LicenseWithRelations } from '@hoop/shared';
import { Badge } from '@/shared/ui/badge';
import { Select } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { TableSkeleton } from '@/shared/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { fetchLicenses } from '../api/licenseApi';
import { fetchCategories } from '@/features/settings/api/categoryApi';

const statusVariant: Record<string, 'success' | 'secondary'> = {
  active: 'success',
  expired: 'secondary',
};

export function LicenseTable() {
  const { data: session } = useSession();
  const router = useRouter();
  const [licenses, setLicenses] = useState<LicenseWithRelations[]>([]);
  const [categories, setCategories] = useState<ReadonlyArray<{ name: string }>>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetchCategories(session.accessToken)
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    fetchLicenses(session.accessToken, {
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
    })
      .then(setLicenses)
      .catch(() => setError('Failed to load licenses'))
      .finally(() => setLoading(false));
  }, [session?.accessToken, statusFilter, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
      )}

      <div className="hidden md:block rounded-lg border">
        {loading ? (
          <TableSkeleton columns={7} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Number</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No licenses found
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => (
                  <TableRow
                    key={license.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/players/${license.playerId}`)}
                  >
                    <TableCell className="font-mono font-medium">{license.number}</TableCell>
                    <TableCell>
                      {license.player.lastName} {license.player.firstName}
                    </TableCell>
                    <TableCell>{license.season.label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{license.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[license.status] ?? 'secondary'}>
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(license.startDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{new Date(license.endDate).toLocaleDateString('fr-FR')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading...</p>
        ) : (
          <>
            {licenses.map((license) => (
              <div
                key={license.id}
                className="cursor-pointer rounded-lg border p-4 space-y-2 active:bg-muted/50"
                onClick={() => router.push(`/players/${license.playerId}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {license.player.lastName} {license.player.firstName}
                  </span>
                  <Badge variant={statusVariant[license.status] ?? 'secondary'}>
                    {license.status}
                  </Badge>
                </div>
                <div className="text-sm font-mono text-muted-foreground">{license.number}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>Season: {license.season.label}</span>
                  <Badge variant="secondary">{license.category}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(license.startDate).toLocaleDateString('fr-FR')} —{' '}
                  {new Date(license.endDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
            {licenses.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No licenses found</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
