import React from 'react';
import { MAX_PREVIEW_ROWS } from '../constants';

interface DataTableProps {
  columns: string[];
  data: any[];
  title?: string;
  maxHeight?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, title, maxHeight = "max-h-[500px]" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-800 rounded-lg border-dashed">
        No data to display
      </div>
    );
  }

  const displayData = data.slice(0, MAX_PREVIEW_ROWS);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
          <span className="text-xs text-gray-500">Showing first {Math.min(data.length, MAX_PREVIEW_ROWS)} rows</span>
        </div>
      )}
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-800 dark:text-gray-300 sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-3 font-semibold border-b border-gray-200 dark:border-slate-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {displayData.map((row, rowIdx) => (
              <tr key={rowIdx} className="bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={`${rowIdx}-${colIdx}`} className="px-6 py-3 text-gray-600 dark:text-gray-400">
                    {String(row[col] !== undefined ? row[col] : '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};