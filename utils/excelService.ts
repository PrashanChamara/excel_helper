import * as XLSX from 'xlsx';
import { SheetData } from '../types';

export const parseExcelFile = async (file: File): Promise<SheetData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // cellDates: true ensures dates are parsed as JS Date objects instead of numbers
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, cellNF: false, cellText: false });
        const sheets: SheetData[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // defval: "" ensures empty cells are empty strings, raw: false tries to keep formatted text if possible, but raw: true with cellDates is better for data integrity
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (jsonData.length > 0) {
            // Extract headers
            const firstRow = jsonData[0] as object;
            const columns = Object.keys(firstRow);
            
            sheets.push({
              id: `${file.name}-${sheetName}-${Date.now()}`,
              name: sheetName,
              fileName: file.name,
              columns,
              rows: jsonData,
            });
          }
        });

        resolve(sheets);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Merged Data");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};