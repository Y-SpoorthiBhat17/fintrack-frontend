// Single source of truth for the default category lists. Both
// TransactionsPage (adding a transaction) and BudgetsPage (setting a
// budget) import from here — previously each had its own separate
// hardcoded array and they drifted out of sync (e.g. "Salary" and
// "Freelance" existed when adding a transaction but were missing from the
// budget dropdown, so you could never set a budget for them).
//
// Once an account has real transactions (manual or imported), BudgetsPage
// shows the real categories from those transactions instead of this list —
// this is only the fallback shown before any transactions exist.

export const PERSONAL_CATEGORIES = [
  'Food', 'Rent', 'Travel', 'Shopping', 'Health', 'Entertainment',
  'Utilities', 'Salary', 'Freelance', 'Investment', 'Others',
];

export const BUSINESS_CATEGORIES = [
  'Salaries', 'Operations', 'Marketing', 'Utilities', 'Equipment',
  'Tax', 'Rent', 'Revenue', 'Others',
];
