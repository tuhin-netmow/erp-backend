# Implementation Plan - Daily Income vs Expense Trend API

## Goal
Create a new GET API endpoint to show the daily income vs. expense trend for the last 30 days in the accounting module.

## Endpoints
*   **GET `/api/accounting/reports/income-expense-trend`**
    *   Query Params: `days` (Optional, default 30)
    *   Response: A list of daily income and expense totals.

## Changes

### 1. Repository (`src/modules/accounting/accounting.repository.js`)
*   Added `getIncomeExpenseTrend(days)`:
    *   Calculates the start date for the trend.
    *   Queries `JournalLine` joined with `Journal` and `Account`.
    *   Groups results by `Journal.date` and `Account.type` (INCOME/EXPENSE).
    *   Returns an array of objects for each day in the range, ensuring even days with zero transactions are included.

### 2. Service (`src/modules/accounting/accounting.service.js`)
*   Added `getIncomeExpenseTrend(days)` wrapper to call the repository.

### 3. Controller (`src/modules/accounting/accounting.controller.js`)
*   Added `getIncomeExpenseTrend(req, res)`:
    *   Parses the `days` parameter from the query string (defaults to 30).
    *   Returns the trend data using the standard success response format.

### 4. Routes (`src/modules/accounting/accounting.routes.js`)
*   Added the `/reports/income-expense-trend` route.
*   Included metadata for API documentation, including description, database details, and example response.

## Verification
*   The logic correctly identifies "INCOME" and "EXPENSE" account types.
*   The daily totals are calculated as `Credit - Debit` for Income and `Debit - Credit` for Expenses, consistent with accounting principles.
*   The response includes every day in the last 30 days, even if no transactions occurred.
