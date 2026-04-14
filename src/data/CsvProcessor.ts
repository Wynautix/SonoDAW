import Papa from 'papaparse';

export interface CsvData {
  headers: string[];
  rows: any[];
  columnStats: Record<string, { min: number; max: number }>;
}

export class CsvProcessor {
  public static async parse(file: File): Promise<CsvData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawHeaders = results.meta.fields || [];
          const rows = results.data;
          
          if (!rows || rows.length === 0) {
            reject(new Error('CSV file is empty or could not be parsed.'));
            return;
          }
          // Sanitize headers for use in formulas
          const sanitize = (h: string) => {
            let s = h.replace(/[^a-zA-Z0-9]/g, '_');
            if (/^[0-9]/.test(s)) s = '_' + s;
            return s;
          };
          const headers = rawHeaders.map(sanitize);
          
          // Rebuild rows with sanitized keys
          const cleanRows = rows.map((row: any) => {
            const cleanRow: any = {};
            rawHeaders.forEach((h, i) => {
              cleanRow[headers[i]] = row[h];
            });
            return cleanRow;
          });

          // Calculate stats for mapping
          const columnStats: Record<string, { min: number; max: number }> = {};
          
          headers.forEach(header => {
            let min = Infinity;
            let max = -Infinity;
            
            cleanRows.forEach((row: any) => {
              const val = row[header];
              if (typeof val === 'number') {
                if (val < min) min = val;
                if (val > max) max = val;
              }
            });
            
            columnStats[header] = { 
              min: min === Infinity ? 0 : min, 
              max: max === -Infinity ? 100 : max 
            };
          });

          resolve({ headers, rows: cleanRows, columnStats });
        },
        error: (err) => reject(err),
      });
    });
  }
}
