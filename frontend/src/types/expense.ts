// types/expense.ts

export interface Expense {
  id: number;
  category: string;
  amount: number | string;
  note: string | null;
  expense_date: string;
  recorded_by: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface StoreExpensePayload {
  category: string;
  amount: number;
  note?: string | null;
  expense_date?: string;
}

export type UpdateExpensePayload = Partial<StoreExpensePayload>;
