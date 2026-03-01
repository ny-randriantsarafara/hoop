'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import type { OcrExtractionResponse, OcrPlayerData, OcrLicenseData, OcrConfidence } from '@hoop/shared';

const confidenceConfig: Record<OcrConfidence, { label: string; className: string; Icon: typeof CheckCircle }> = {
  high: { label: 'High confidence', className: 'text-green-600', Icon: CheckCircle },
  medium: { label: 'Medium confidence', className: 'text-yellow-600', Icon: AlertTriangle },
  low: { label: 'Low confidence', className: 'text-red-600', Icon: AlertCircle },
};

interface ExtractionReviewProps {
  readonly extraction: OcrExtractionResponse;
  readonly onSavePlayer: (player: OcrPlayerData, extractionId: string) => void;
  readonly onSavePlayerAndLicense: (player: OcrPlayerData, license: OcrLicenseData, extractionId: string) => void;
  readonly saving: boolean;
}

export function ExtractionReview({
  extraction,
  onSavePlayer,
  onSavePlayerAndLicense,
  saving,
}: ExtractionReviewProps) {
  const emptyPlayer: OcrPlayerData = { firstName: null, lastName: null, birthDate: null, gender: null, address: null, phone: null, email: null };
  const emptyLicense: OcrLicenseData = { number: null, category: null, startDate: null, endDate: null };

  const [player, setPlayer] = useState<OcrPlayerData>(extraction.player ?? emptyPlayer);
  const [license, setLicense] = useState<OcrLicenseData>(extraction.license ?? emptyLicense);

  const { label, className, Icon } = confidenceConfig[extraction.confidence];

  const hasLicenseData = Boolean(
    extraction.license && (license.number ?? license.category ?? license.startDate ?? license.endDate),
  );

  function updatePlayer<K extends keyof OcrPlayerData>(key: K, value: string) {
    setPlayer((prev) => ({ ...prev, [key]: value || null }));
  }

  function updateLicense<K extends keyof OcrLicenseData>(key: K, value: string) {
    setLicense((prev) => ({ ...prev, [key]: value || null }));
  }

  return (
    <div className="space-y-6">
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground ml-2">
          Review and correct the extracted data before saving
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Player Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ocr-lastName">Last Name</Label>
              <Input
                id="ocr-lastName"
                value={player.lastName ?? ''}
                onChange={(e) => updatePlayer('lastName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ocr-firstName">First Name</Label>
              <Input
                id="ocr-firstName"
                value={player.firstName ?? ''}
                onChange={(e) => updatePlayer('firstName', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ocr-birthDate">Birth Date</Label>
              <Input
                id="ocr-birthDate"
                type="date"
                value={player.birthDate ?? ''}
                onChange={(e) => updatePlayer('birthDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ocr-gender">Gender</Label>
              <Select
                id="ocr-gender"
                value={player.gender ?? ''}
                onChange={(e) => updatePlayer('gender', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="G">Boy (G)</option>
                <option value="F">Girl (F)</option>
                <option value="H">Man (H)</option>
                <option value="D">Woman (D)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ocr-address">Address</Label>
            <Input
              id="ocr-address"
              value={player.address ?? ''}
              onChange={(e) => updatePlayer('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ocr-phone">Phone</Label>
              <Input
                id="ocr-phone"
                value={player.phone ?? ''}
                onChange={(e) => updatePlayer('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ocr-email">Email</Label>
              <Input
                id="ocr-email"
                type="email"
                value={player.email ?? ''}
                onChange={(e) => updatePlayer('email', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {hasLicenseData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">License Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ocr-licenseNumber">License Number</Label>
                <Input
                  id="ocr-licenseNumber"
                  value={license.number ?? ''}
                  onChange={(e) => updateLicense('number', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ocr-licenseCategory">Category</Label>
                <Input
                  id="ocr-licenseCategory"
                  value={license.category ?? ''}
                  onChange={(e) => updateLicense('category', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ocr-licenseStartDate">Start Date</Label>
                <Input
                  id="ocr-licenseStartDate"
                  type="date"
                  value={license.startDate ?? ''}
                  onChange={(e) => updateLicense('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ocr-licenseEndDate">End Date</Label>
                <Input
                  id="ocr-licenseEndDate"
                  type="date"
                  value={license.endDate ?? ''}
                  onChange={(e) => updateLicense('endDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => onSavePlayer(player, extraction.extractionId)}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Player'}
        </Button>
        {hasLicenseData && (
          <Button
            variant="secondary"
            onClick={() => onSavePlayerAndLicense(player, license, extraction.extractionId)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Player + License'}
          </Button>
        )}
      </div>
    </div>
  );
}
