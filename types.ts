export interface SheetData {
  id: string;
  name: string;
  fileName: string;
  columns: string[];
  rows: any[];
}

export interface MergeSourceConfig {
  sheetId: string;
  joinKey: string;
  columnsToCopy: string[];
  enabled: boolean;
}

export interface MergeConfig {
  targetSheetId: string;
  sources: Record<string, MergeSourceConfig>; // Keyed by sheetId
}

export type Theme = 'light' | 'dark';