export type Mode = 'personal' | 'business';
export type TxType = 'income' | 'expense';

export interface User {
  id: string;
  name: string;
  email: string;
  mode: Mode;
  company?: string;
  company_id?: string | null;
  currency?: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string;
  date: string;
  mode: Mode;
  receiptUrl?: string;
  tags?: string[];
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: number;
  year: number;
  mode: Mode;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
