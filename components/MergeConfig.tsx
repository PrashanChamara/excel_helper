import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Download, RefreshCw, CheckCircle2, AlertCircle, Plus, Link as LinkIcon, Layers } from 'lucide-react';
import { SheetData, MergeSourceConfig } from '../types';
import { Button } from './Button';
import { exportToExcel } from '../utils/excelService';

interface MergeConfigProps {
  sheets: SheetData[];
}

export const MergeConfig: React.FC<MergeConfigProps> = ({ sheets }) => {
  const [targetSheetId, setTargetSheetId] = useState<string>('');
  const [sourceConfigs, setSourceConfigs] = useState<Record<string, MergeSourceConfig>>({});
  const [mergedData, setMergedData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetSheet = sheets.find(s => s.id === targetSheetId);
  const availableSourceSheets = sheets.filter(s => s.id !== targetSheetId);

  // When target changes, reset or re-evaluate source configs
  useEffect(() => {
    if (!targetSheet) {
      setSourceConfigs({});
      return;
    }

    const newConfigs: Record<string, MergeSourceConfig> = {};
    
    availableSourceSheets.forEach(source => {
      // Find common columns
      const common = source.columns.filter(col => targetSheet.columns.includes(col));
      const defaultJoin = common.length > 0 ? common[0] : '';
      const defaultCols = source.columns.filter(col => col !== defaultJoin && !targetSheet.columns.includes(col));

      newConfigs[source.id] = {
        sheetId: source.id,
        joinKey: defaultJoin,
        columnsToCopy: defaultCols, // Default to copying new unique columns
        enabled: false // User must explicitly enable
      };
    });

    setSourceConfigs(newConfigs);
    setMergedData(null);
  }, [targetSheetId, sheets.length]); // Dependency on length to catch new uploads

  const handleToggleSource = (sheetId: string) => {
    setSourceConfigs(prev => ({
      ...prev,
      [sheetId]: { ...prev[sheetId], enabled: !prev[sheetId].enabled }
    }));
    setMergedData(null);
  };

  const updateSourceConfig = (sheetId: string, updates: Partial<MergeSourceConfig>) => {
    setSourceConfigs(prev => ({
      ...prev,
      [sheetId]: { ...prev[sheetId], ...updates }
    }));
    setMergedData(null);
  };

  const toggleColumn = (sheetId: string, col: string) => {
    const config = sourceConfigs[sheetId];
    if (!config) return;

    const newCols = config.columnsToCopy.includes(col)
      ? config.columnsToCopy.filter(c => c !== col)
      : [...config.columnsToCopy, col];
    
    updateSourceConfig(sheetId, { columnsToCopy: newCols });
  };

  const handleMerge = () => {
    setError(null);
    if (!targetSheet) return;

    const activeSources = Object.values(sourceConfigs).filter(c => c.enabled);
    
    if (activeSources.length === 0) {
      setError("Please select at least one source sheet to merge from.");
      return;
    }

    // Validation
    for (const conf of activeSources) {
      if (!conf.joinKey) {
        const sheet = sheets.find(s => s.id === conf.sheetId);
        setError(`Please select a join key for source: ${sheet?.fileName}`);
        return;
      }
    }

    try {
      // Start with a deep copy of target rows
      let resultData = JSON.parse(JSON.stringify(targetSheet.rows));

      // Process each source sequentially
      activeSources.forEach(config => {
        const sourceSheet = sheets.find(s => s.id === config.sheetId);
        if (!sourceSheet) return;

        // Create lookup map for this source
        // Normalize keys to lowercase string for reliable matching
        const sourceMap = new Map();
        sourceSheet.rows.forEach(row => {
          const rawKey = row[config.joinKey];
          if (rawKey !== undefined && rawKey !== null) {
            const key = String(rawKey).trim().toLowerCase();
            sourceMap.set(key, row);
          }
        });

        // Merge into resultData
        resultData = resultData.map((row: any) => {
          const targetKeyRaw = row[config.joinKey]; // Join key must exist in target
          // If the target doesn't have the key column for this specific source join, we can't match.
          // However, standard VLOOKUP implies the key exists in the base (target).
          
          if (targetKeyRaw !== undefined && targetKeyRaw !== null) {
             const targetKey = String(targetKeyRaw).trim().toLowerCase();
             const sourceRow = sourceMap.get(targetKey);

             if (sourceRow) {
               config.columnsToCopy.forEach(col => {
                 // Value paste: simple assignment.
                 // If column exists, we overwrite. If not, we add.
                 row[col] = sourceRow[col];
               });
             }
          }
          return row;
        });
      });

      setMergedData(resultData);
    } catch (err) {
      console.error(err);
      setError("An error occurred during the merge process.");
    }
  };

  if (sheets.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <ArrowRightLeft className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">Please upload at least 2 Excel sheets</p>
        <p className="text-sm mt-2">Upload multiple files to start the multi-sheet merge workflow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Target Selection */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border-2 border-primary-100 dark:border-primary-900/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
             <Layers className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold dark:text-white">Step 1: Select Master Sheet (Target)</h3>
            <p className="text-sm text-gray-500">This is your main file where data will be collected.</p>
          </div>
        </div>

        <select 
          className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-white text-lg"
          value={targetSheetId}
          onChange={(e) => setTargetSheetId(e.target.value)}
        >
          <option value="">-- Choose Master File --</option>
          {sheets.map(sheet => (
            <option key={sheet.id} value={sheet.id}>{sheet.fileName} - {sheet.name} ({sheet.rows.length} rows)</option>
          ))}
        </select>
      </div>

      {targetSheet && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-bold dark:text-white flex items-center">
               <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
               Configure Sources
             </h3>
             <span className="text-xs text-gray-500">Select files to merge into Master</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {availableSourceSheets.map(source => {
              const config = sourceConfigs[source.id];
              if (!config) return null;

              const commonCols = source.columns.filter(c => targetSheet.columns.includes(c));
              const hasCommon = commonCols.length > 0;
              const isEnabled = config.enabled;

              return (
                <div 
                  key={source.id} 
                  className={`relative rounded-xl border transition-all duration-200 ${
                    isEnabled 
                      ? 'border-primary-500 ring-1 ring-primary-500 bg-white dark:bg-slate-900 shadow-md' 
                      : 'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 hover:border-gray-300'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                         <input 
                           type="checkbox" 
                           checked={isEnabled}
                           onChange={() => handleToggleSource(source.id)}
                           disabled={!hasCommon}
                           className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer disabled:opacity-50"
                         />
                         <div>
                            <h4 className={`font-semibold ${isEnabled ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {source.fileName}
                            </h4>
                            <p className="text-xs text-gray-500">{source.name}</p>
                         </div>
                      </div>
                      
                      {isEnabled && hasCommon && (
                        <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium flex items-center">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Ready to Merge
                        </div>
                      )}
                      {!hasCommon && (
                         <div className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
                           No Match Found
                         </div>
                      )}
                    </div>

                    {isEnabled && (
                      <div className="space-y-4 pl-8 border-l-2 border-gray-100 dark:border-slate-800 ml-2">
                        {/* Connection Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Match "{targetSheet.fileName}" using column:
                              </label>
                              <select 
                                value={config.joinKey}
                                onChange={(e) => updateSourceConfig(source.id, { joinKey: e.target.value })}
                                className="w-full p-2 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 dark:text-white"
                              >
                                {commonCols.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <p className="text-[10px] text-gray-400 mt-1">
                                The app will look up this value in the Master sheet.
                              </p>
                           </div>
                           
                           <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">
                                Copy these columns to Master:
                             </label>
                             <div className="flex flex-wrap gap-2">
                               {source.columns
                                 .filter(c => c !== config.joinKey) // Don't show the join key itself
                                 .map(col => (
                                 <button
                                    key={col}
                                    onClick={() => toggleColumn(source.id, col)}
                                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                                      config.columnsToCopy.includes(col)
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                                    }`}
                                 >
                                    {config.columnsToCopy.includes(col) ? '✓ ' : '+ '}{col}
                                 </button>
                               ))}
                             </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 gap-4">
            <div className="text-sm">
               {mergedData ? (
                 <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                   <CheckCircle2 className="w-5 h-5 mr-2" />
                   Successfully merged {Object.values(sourceConfigs).filter(c => c.enabled).length} source(s)!
                 </span>
               ) : (
                 <span className="text-gray-500 dark:text-gray-400">
                   {Object.values(sourceConfigs).filter(c => c.enabled).length} source file(s) selected
                 </span>
               )}
               {error && <span className="text-red-500 block font-medium mt-1">{error}</span>}
            </div>

            <div className="flex space-x-3 w-full sm:w-auto">
                <Button 
                   onClick={handleMerge} 
                   className="w-full sm:w-auto shadow-md"
                   disabled={Object.values(sourceConfigs).filter(c => c.enabled).length === 0}
                >
                   <RefreshCw className="w-4 h-4 mr-2" />
                   Merge All Files
                </Button>
                {mergedData && (
                  <Button onClick={() => exportToExcel(mergedData, `Merged_Master_${Date.now()}`)} variant="secondary" className="w-full sm:w-auto shadow-md">
                    <Download className="w-4 h-4 mr-2" />
                    Download Result
                  </Button>
                )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};