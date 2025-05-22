
export type NepaliMonth = 
  | "Baisakh"
  | "Jestha"
  | "Ashad"
  | "Shrawan"
  | "Bhadra"
  | "Ashoj"
  | "Kartik"
  | "Mangsir"
  | "Poush"
  | "Magh"
  | "Falgun"
  | "Chaitra";

export interface Student {
  id: string;
  name: string;
  grade: string;
  contact: string;
  address?: string;
  guardianName?: string;
  guardianContact?: string;
  joiningDate: string;
  active: boolean;
  feeAmount: number;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  month: NepaliMonth;
  year: number;
  paidDate: string;
  isAdvance: boolean;
  isPending: boolean;
  notes?: string;
}

export interface MonthlyReport {
  month: NepaliMonth;
  year: number;
  totalCollection: number;
  totalPending: number;
  totalAdvance: number;
  studentsPaid: number;
  studentsPending: number;
}
