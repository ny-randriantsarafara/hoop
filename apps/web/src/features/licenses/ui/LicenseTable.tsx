'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { LicenseWithRelations } from '@hoop/shared';
import { licenseFilterFields } from '@hoop/shared';
import { Badge } from '@/shared/ui/badge';
import { TableSkeleton } from '@/shared/ui/skeleton';
import { FilterBar } from '@/shared/ui/filter-bar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { fetchLicenses } from '../api/licenseApi';
import { fetchCategories } from '@/features/settings/api/categoryApi';
import { fetchSeasons } from '@/features/settings/api/seasonApi';

const statusVariant: Record<string, 'success' | 'secondary'> = {
  active: 'success',
  expired: 'secondary',
};

const EMPTY_FILTERS: Record<string, string> = {};

export function LicenseTable() {
  const { data: session } = useSession();
  const router = useRouter();
  const [licenses, setLicenses] = useState<LicenseWithRelations[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(EMPTY_FILTERS);
  const [dynamicOptions, setDynamicOptions] = useState<
    Record<string, ReadonlyArray<{ value: string; label: string }>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    Promise.all([fetchCategories(session.accessToken), fetchSeasons(session.accessToken)])
      .then(([cats, seasons]) => {
        setDynamicOptions({
          category: cats.map((c) => ({ value: c.name, label: c.name })),
          seasonId: seasons.map((s) => ({ value: s.id, label: s.label })),
        });
      })
      .catch(() => setDynamicOptions({}));
  }, [session?.accessToken]);

  const loadLicenses = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLicenses(session.accessToken, filterValues);
      setLicenses(data);
    } catch {
      setError('Failed to load licenses');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, filterValues]);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  function handleFilterChange(key: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilterValues(EMPTY_FILTERS);
  }

  return (
    <div className="space-y-4">
      <FilterBar
        fields={licenseFilterFields}
        values={filterValues}
        onChange={handleFilterChange}
        onClear={clearFilters}
        dynamicOptions={dynamicOptions}
      />

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
