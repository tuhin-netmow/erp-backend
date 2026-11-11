# Implementation Plan - Update Product Profit Loss Report API

## Goal
Update the `GET /api/accounting/reports/product-profit-loss` endpoint to return product-wise profit and loss data in a specific format requested by the user.

## Changes

### 1. Repository Update (`src/modules/accounting/accounting.repository.js`)
*   Modified `getProductProfitLoss` method.
*   Updated the data transformation logic to include:
    *   `sku`
    *   `name`
    *   `qty` (Total Quantity Sold)
    *   `salesPrice` (Average Unit Sales Price)
    *   `salesAmount` (Total Revenue)
    *   `costPrice` (Average Unit Cost Price)
    *   `costAmount` (Total Cost)
    *   `profitPrice` (Unit Profit)
    *   `profitAmount` (Total Profit)
    *   `profitRatio` (Profit Margin Percentage)

### 2. Routes Update (`src/modules/accounting/accounting.routes.js`)
*   Updated the example response in the route documentation to reflect the new data structure.

## Verification
*   Checked `accounting.repository.js` to ensure the logic handles calculations and formatting correctly, including avoiding division by zero.
*   The API endpoint `/api/accounting/reports/product-profit-loss` now returns the array of objects as requested.
