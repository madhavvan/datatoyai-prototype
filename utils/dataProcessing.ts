import { DataRow, ColumnStats, CleaningOperation, OperationType } from '../types';

// Simple CSV Parser
export const parseCSV = (csvText: string): DataRow[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: DataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    // Handle quoted strings with commas purely with regex is hard, simple split for this demo
    // A robust app would use a proper lexer
    const values = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => {
      const val = v.trim().replace(/^"|"$/g, '');
      if (val === '' || val.toLowerCase() === 'null' || val.toLowerCase() === 'nan') return null;
      const num = Number(val);
      return isNaN(num) ? val : num;
    });

    const row: DataRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index] : null;
    });
    data.push(row);
  }
  return data;
};

export const getColumnStats = (data: DataRow[]): ColumnStats[] => {
  if (data.length === 0) return [];
  const headers = Object.keys(data[0]);
  
  return headers.map(header => {
    let missing = 0;
    const values = new Set();
    let numCount = 0;
    let boolCount = 0;
    let strCount = 0;

    data.forEach(row => {
      const val = row[header];
      if (val === null || val === undefined || val === '') {
        missing++;
      } else {
        values.add(val);
        if (typeof val === 'number') numCount++;
        else if (typeof val === 'boolean') boolCount++;
        else strCount++;
      }
    });

    let type: 'string' | 'number' | 'boolean' | 'mixed' = 'string';
    if (numCount > 0 && strCount === 0 && boolCount === 0) type = 'number';
    else if (boolCount > 0 && strCount === 0 && numCount === 0) type = 'boolean';
    else if ((numCount > 0 && strCount > 0) || (numCount > 0 && boolCount > 0)) type = 'mixed';

    return {
      name: header,
      type,
      missingCount: missing,
      uniqueCount: values.size,
      sample: Array.from(values).slice(0, 5)
    };
  });
};

export const applyOperation = (data: DataRow[], op: CleaningOperation): DataRow[] => {
  const newData = data.map(row => ({ ...row })); // Shallow copy rows

  switch (op.type) {
    case OperationType.FILL_MISSING:
      if (!op.column || op.value === undefined) return data;
      return newData.map(row => {
        if (row[op.column!] === null) {
          row[op.column!] = op.value!;
        }
        return row;
      });

    case OperationType.DROP_MISSING:
      if (!op.column) return data;
      return newData.filter(row => row[op.column!] !== null);

    case OperationType.CONVERT_TYPE:
      if (!op.column || !op.targetType) return data;
      return newData.map(row => {
        const val = row[op.column!];
        if (val !== null) {
          if (op.targetType === 'number') {
            const num = Number(val);
            row[op.column!] = isNaN(num) ? null : num;
          } else if (op.targetType === 'string') {
            row[op.column!] = String(val);
          } else if (op.targetType === 'boolean') {
             // Simple heuristic
             const s = String(val).toLowerCase();
             row[op.column!] = (s === 'true' || s === '1' || s === 'yes');
          }
        }
        return row;
      });
    
    case OperationType.RENAME_COLUMN:
      // This is harder with row-based structure, requires mapping all keys
      // Skipping for this simple demo structure or implementing naively
      return data; 

    case OperationType.MAP_VALUES:
        if (!op.column || !op.mapping) return data;
        return newData.map(row => {
            const val = row[op.column!];
            if (val !== null && String(val) in op.mapping!) {
                row[op.column!] = op.mapping![String(val)];
            }
            return row;
        });

    case OperationType.DROP_COLUMN:
        if (!op.column) return data;
        return newData.map(row => {
            delete row[op.column!];
            return row;
        });

    default:
      return data;
  }
};
