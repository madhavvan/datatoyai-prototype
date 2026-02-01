export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface ColumnStats {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'mixed';
  missingCount: number;
  uniqueCount: number;
  sample: any[];
}

export enum OperationType {
  FILL_MISSING = 'FILL_MISSING',
  DROP_MISSING = 'DROP_MISSING',
  CONVERT_TYPE = 'CONVERT_TYPE',
  RENAME_COLUMN = 'RENAME_COLUMN',
  DROP_COLUMN = 'DROP_COLUMN',
  FILTER_ROWS = 'FILTER_ROWS',
  MAP_VALUES = 'MAP_VALUES',
  UNKNOWN = 'UNKNOWN'
}

export interface CleaningOperation {
  type: OperationType;
  column?: string;
  value?: string | number | boolean; // For fill values
  targetType?: 'string' | 'number' | 'boolean'; // For type conversion
  mapping?: Record<string, any>; // For categorical mapping
  description: string; // Human readable description of what happened
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  operations?: CleaningOperation[];
  timestamp: number;
}
