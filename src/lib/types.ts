export type SaleBoard = "NLB" | "DLB";

export interface SaleItem {
  id?: string;
  board: SaleBoard;
  code: string;
  gross: number;
  deduction: number;
  net: number;
}
