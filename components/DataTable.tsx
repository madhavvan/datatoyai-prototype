import React, { useMemo } from 'react';
import { DataRow } from '../types';

interface DataTableProps {
  data: DataRow[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const headers = useMemo(() => data.length > 0 ? Object.keys(data[0]) : [], [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        No data loaded. Upload a CSV file to begin.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-slate-900 border border-slate-700 rounded-lg shadow-inner">
      <table className="min-w-full text-left text-sm whitespace-nowrap">
        <thead className="sticky top-0 bg-slate-800 z-10 shadow-sm">
          <tr>
            <th className="px-4 py-3 font-medium text-slate-300 border-b border-slate-700 w-12 text-center">#</th>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium text-slate-300 border-b border-slate-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.slice(0, 100).map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-2 text-slate-500 border-r border-slate-800 text-center text-xs">{idx + 1}</td>
              {headers.map((header) => (
                <td key={`${idx}-${header}`} className="px-4 py-2 text-slate-400">
                  {row[header] === null ? (
                    <span className="text-red-400 italic text-xs">null</span>
                  ) : (
                    String(row[header])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 100 && (
        <div className="p-4 text-center text-slate-500 text-sm bg-slate-900 border-t border-slate-700">
          Showing first 100 rows of {data.length}
        </div>
      )}
    </div>
  );
};
