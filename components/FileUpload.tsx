import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isProcessing) return;
    
    const droppedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')
    );
    
    if (droppedFiles.length > 0) {
      onFileUpload(droppedFiles);
    }
  }, [onFileUpload, isProcessing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !isProcessing) {
      onFileUpload(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-8 transition-colors hover:border-primary-500 dark:hover:border-primary-500 bg-white dark:bg-slate-900 group cursor-pointer"
    >
      <input
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={isProcessing}
      />
      <div className="flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">
          {isProcessing ? (
             <Upload className="w-8 h-8 animate-bounce" />
          ) : (
             <FileSpreadsheet className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {isProcessing ? "Processing..." : "Drop Excel files here"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          or click to select files (.xlsx, .csv)
        </p>
      </div>
    </div>
  );
};