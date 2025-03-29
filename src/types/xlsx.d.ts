declare module 'xlsx' {
  export const utils: {
    book_new: () => any;
    book_append_sheet: (workbook: any, worksheet: any, name: string) => void;
    aoa_to_sheet: (data: any[][]) => any;
    sheet_add_aoa: (worksheet: any, data: any[][], opts?: any) => any;
  };
  export const write: (workbook: any, opts?: any) => any;
  export const writeFile: (workbook: any, filename: string) => void;
  export const SSF: any;
} 