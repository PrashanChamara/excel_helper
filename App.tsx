import React, { useState, useEffect } from 'react';
import { Moon, Sun, Table2, Trash2, Eye } from 'lucide-react';
import { SheetData, Theme } from './types';
import { FileUpload } from './components/FileUpload';
import { parseExcelFile } from './utils/excelService';
import { MergeConfig } from './components/MergeConfig';
import { DataTable } from './components/DataTable';
import { Button } from './components/Button';

function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSheetId, setPreviewSheetId] = useState<string | null>(null);

  useEffect(() => {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleFileUpload = async (files: File[]) => {
    setIsProcessing(true);
    try {
      const allNewSheets: SheetData[] = [];
      for (const file of files) {
        const newSheets = await parseExcelFile(file);
        allNewSheets.push(...newSheets);
      }
      setSheets(prev => [...prev, ...allNewSheets]);
    } catch (error) {
      console.error("Error parsing files", error);
      alert("Error reading Excel files. Please ensure they are valid.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeSheet = (id: string) => {
    setSheets(prev => prev.filter(s => s.id !== id));
    if (previewSheetId === id) setPreviewSheetId(null);
  };

  const previewSheet = sheets.find(s => s.id === previewSheetId);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-950/80 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Table2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-200">
                SheetMerge Pro
              </h1>
            </div>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-400"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Section: Upload and List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Uploader & File List */}
          <div className="space-y-6">
             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Files</h2>
                <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
                
                <div className="mt-6 space-y-3">
                  {sheets.length === 0 && (
                    <p className="text-sm text-gray-500 text-center italic">No files uploaded yet</p>
                  )}
                  {sheets.map(sheet => (
                    <div key={sheet.id} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <Table2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={sheet.fileName}>
                            {sheet.fileName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{sheet.name} • {sheet.rows.length} rows</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setPreviewSheetId(prev => prev === sheet.id ? null : sheet.id)}
                          className={`p-1.5 rounded-md transition-colors ${previewSheetId === sheet.id ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500'}`}
                          title="Preview Data"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeSheet(sheet.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 rounded-md transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Right: Work Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-1 border border-gray-200 dark:border-slate-800">
              <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Merge Configuration</h2>
              </div>
              <div className="p-4">
                 <MergeConfig sheets={sheets} />
              </div>
            </div>

            {/* Preview Section */}
            {previewSheet && (
              <div className="animate-fadeIn">
                 <DataTable 
                    columns={previewSheet.columns} 
                    data={previewSheet.rows} 
                    title={`Preview: ${previewSheet.fileName} - ${previewSheet.name}`}
                 />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;