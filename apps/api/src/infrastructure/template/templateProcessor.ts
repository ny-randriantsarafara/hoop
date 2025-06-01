import ExcelJS from 'exceljs';
import { createReport } from 'docx-templates';
import { computeCategory } from '@hoop/shared';
import type { CategoryDefinition } from '@hoop/shared';
import type { PlayerEntity } from '../../domain/player/playerEntity.js';

export interface DocumentPlayerData {
  readonly player: PlayerEntity;
}

export interface DocumentContext {
  readonly seasonLabel: string;
  readonly clubName: string;
  readonly clubSection: string;
  readonly exportDate: string;
  readonly players: ReadonlyArray<DocumentPlayerData>;
  readonly categories: ReadonlyArray<CategoryDefinition>;
}

const PLAYER_PLACEHOLDER_REGEX =
  /\{\{(order|playerLastName|playerFirstName|playerBirthDate|playerGender|playerAddress|playerCategory)\}\}/;

function getPlayerReplacements(
  entry: DocumentPlayerData,
  index: number,
  seasonYear: number,
  categories: ReadonlyArray<CategoryDefinition>,
): Record<string, string> {
  return {
    '{{order}}': String(index + 1),
    '{{playerLastName}}': entry.player.lastName,
    '{{playerFirstName}}': entry.player.firstName,
    '{{playerBirthDate}}': entry.player.birthDate.toLocaleDateString('fr-FR'),
    '{{playerGender}}': entry.player.gender,
    '{{playerAddress}}': entry.player.address,
    '{{playerCategory}}': computeCategory(entry.player.birthDate, seasonYear, categories),
  };
}

export async function processXlsxTemplate(
  templateBuffer: Buffer,
  context: DocumentContext,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    templateBuffer as unknown as Parameters<ExcelJS.Workbook['xlsx']['load']>[0],
  );

  const documentReplacements: Record<string, string> = {
    '{{seasonLabel}}': context.seasonLabel,
    '{{clubName}}': context.clubName,
    '{{clubSection}}': context.clubSection,
    '{{exportDate}}': context.exportDate,
  };

  const seasonYear = parseInt(context.seasonLabel, 10) || new Date().getFullYear();
  const categories = context.categories;

  workbook.eachSheet((sheet) => {
    let templateRowNumber: number | null = null;

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === 'string') {
          if (PLAYER_PLACEHOLDER_REGEX.test(cell.value)) {
            if (templateRowNumber === null) {
              templateRowNumber = row.number;
            }
          }

          let newValue = cell.value;
          for (const [placeholder, replacement] of Object.entries(documentReplacements)) {
            newValue = newValue.replaceAll(placeholder, replacement);
          }
          if (newValue !== cell.value) {
            cell.value = newValue;
          }
        }
      });
    });

    if (templateRowNumber === null || context.players.length === 0) return;

    const templateRow = sheet.getRow(templateRowNumber);
    const colCount = templateRow.cellCount;
    const templatePatterns: Array<{
      value: string;
      style: Partial<Pick<ExcelJS.Style, 'font' | 'border' | 'alignment' | 'fill'>>;
    }> = [];

    for (let col = 1; col <= colCount; col++) {
      const cell = templateRow.getCell(col);
      templatePatterns.push({
        value: typeof cell.value === 'string' ? cell.value : '',
        style: {
          font: cell.font ? { ...cell.font } : undefined,
          border: cell.border ? { ...cell.border } : undefined,
          alignment: cell.alignment ? { ...cell.alignment } : undefined,
          fill: cell.fill ? { ...cell.fill } : undefined,
        },
      });
    }

    const firstEntry = context.players[0];
    const firstReplacements = getPlayerReplacements(firstEntry, 0, seasonYear, categories);

    templatePatterns.forEach((pattern, colIndex) => {
      const cell = templateRow.getCell(colIndex + 1);
      let value = pattern.value;
      for (const [placeholder, replacement] of Object.entries(firstReplacements)) {
        value = value.replaceAll(placeholder, replacement);
      }
      for (const [placeholder, replacement] of Object.entries(documentReplacements)) {
        value = value.replaceAll(placeholder, replacement);
      }
      cell.value = value;
      if (pattern.style.font) cell.font = pattern.style.font;
      if (pattern.style.border) cell.border = pattern.style.border as Partial<ExcelJS.Borders>;
      if (pattern.style.alignment) cell.alignment = pattern.style.alignment;
      if (pattern.style.fill) cell.fill = pattern.style.fill as ExcelJS.Fill;
    });

    if (context.players.length > 1) {
      const additionalRows = context.players.slice(1).map((entry, idx) => {
        const replacements = getPlayerReplacements(entry, idx + 1, seasonYear, categories);
        return templatePatterns.map((pattern) => {
          let value = pattern.value;
          for (const [placeholder, replacement] of Object.entries(replacements)) {
            value = value.replaceAll(placeholder, replacement);
          }
          for (const [placeholder, replacement] of Object.entries(documentReplacements)) {
            value = value.replaceAll(placeholder, replacement);
          }
          return value;
        });
      });

      sheet.spliceRows(templateRowNumber + 1, 0, ...additionalRows);

      for (let i = 0; i < additionalRows.length; i++) {
        const row = sheet.getRow(templateRowNumber + 1 + i);
        for (let col = 0; col < templatePatterns.length; col++) {
          const cell = row.getCell(col + 1);
          const pattern = templatePatterns[col];
          if (pattern.style.font) cell.font = pattern.style.font;
          if (pattern.style.border) cell.border = pattern.style.border as Partial<ExcelJS.Borders>;
          if (pattern.style.alignment) cell.alignment = pattern.style.alignment;
          if (pattern.style.fill) cell.fill = pattern.style.fill as ExcelJS.Fill;
        }
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function processDocxTemplate(
  templateBuffer: Buffer,
  context: DocumentContext,
): Promise<Buffer> {
  const seasonYear = parseInt(context.seasonLabel, 10) || new Date().getFullYear();
  const categories = context.categories;

  const players = context.players.map((entry, index) => ({
    order: index + 1,
    playerLastName: entry.player.lastName,
    playerFirstName: entry.player.firstName,
    playerBirthDate: entry.player.birthDate.toLocaleDateString('fr-FR'),
    playerGender: entry.player.gender,
    playerAddress: entry.player.address,
    playerCategory: computeCategory(entry.player.birthDate, seasonYear, categories),
  }));

  const result = await createReport({
    template: templateBuffer,
    data: {
      seasonLabel: context.seasonLabel,
      clubName: context.clubName,
      clubSection: context.clubSection,
      exportDate: context.exportDate,
      players,
    },
    cmdDelimiter: ['{{', '}}'],
  });

  return Buffer.from(result);
}
