# FINANCIA — Accounting Scenario Validation

**Batch 1 / Phase 2 — design validation artifact**  
**Version:** 1.0 · **Date:** 2026-11-23

These examples validate the proposed ERD and ledger model before SQL is applied. All numbers are illustrative IDR values. They are acceptance cases for database functions, constraints, and later automated tests.

## 1. Core posting examples

### A. Opening balance — BCA Suami

Initial account balance: Rp10,000,000.

| Ledger account | Debit | Credit |
|---|---:|---:|
| Bank — BCA Suami | 10,000,000 | — |
| Opening balance equity | — | 10,000,000 |
| **Total** | **10,000,000** | **10,000,000** |

Expected:
- Financial account stores the opening balance amount and date as setup metadata.
- A posted opening-balance transaction creates the matching journal.
- Subsequent account balance is derived from journal lines.
- No household income is recognized from an opening balance.

### B. Salary received — Suami

Salary: Rp10,000,000 into BCA Suami.

| Ledger account | Debit | Credit |
|---|---:|---:|
| Bank — BCA Suami | 10,000,000 | — |
| Salary income — Suami | — | 10,000,000 |
| **Total** | **10,000,000** | **10,000,000** |

Expected:
- Household income increases Rp10,000,000.
- Income owner attribution is `husband`.
- Account holder attribution and income owner attribution remain independent.

### C. Household kitchen purchase — BCA Istri

Kitchen spending: Rp350,000.

| Ledger account | Debit | Credit |
|---|---:|---:|
| Household expense — Kitchen | 350,000 | — |
| Bank — BCA Istri | — | 350,000 |
| **Total** | **350,000** | **350,000** |

Expected:
- Household expense increases Rp350,000.
- The spend is assigned to the kitchen category and household budget period.
- The transaction records who entered it; the financial account owner remains `wife`.

### D. Transfer between spouses' accounts

Transfer Rp1,000,000 from BCA Suami to BCA Istri.

| Ledger account | Debit | Credit |
|---|---:|---:|
| Bank — BCA Istri | 1,000,000 | — |
| Bank — BCA Suami | — | 1,000,000 |
| **Total** | **1,000,000** | **1,000,000** |

Expected:
- Source account decreases Rp1,000,000.
- Destination account increases Rp1,000,000.
- Household income impact = Rp0.
- Household expense impact = Rp0.
- Cash-flow reports classify it as an internal transfer, not income or expense.

### E. Personal gold investment purchase

Buy 1 gram gold for Rp1,500,000 from BCA Istri.

| Ledger account | Debit | Credit |
|---|---:|---:|
| Personal gold asset | 1,500,000 | — |
| Bank — BCA Istri | — | 1,500,000 |
| **Total** | **1,500,000** | **1,500,000** |

Expected:
- The asset holding/lot and acquisition movement are recorded.
- Purchase cost is Rp1,500,000.
- Household consumption expense impact = Rp0.
- Cash decreases and personal investment asset increases.

### F. Gold market valuation update

Market valuation rises from Rp1,500,000 to Rp1,700,000.

Expected:
- A new asset valuation observation is inserted with source and timestamp.
- The latest valuation is Rp1,700,000.
- Unrealized gain is Rp200,000.
- No cash account changes.
- No income journal line is automatically created.
- Net worth reporting may display market value separately from historical acquisition cost.

### G. Liability payment — principal, interest, fee

Payment total Rp1,000,000 comprising:
- Principal: Rp800,000
- Interest: Rp150,000
- Fee: Rp50,000

| Ledger account | Debit | Credit |
|---|---:|---:|
| Liability payable | 800,000 | — |
| Interest expense | 150,000 | — |
| Fee expense | 50,000 | — |
| Bank — BCA Suami | — | 1,000,000 |
| **Total** | **1,000,000** | **1,000,000** |

Expected:
- Outstanding principal decreases Rp800,000.
- Expense increases only Rp200,000.
- Cash decreases Rp1,000,000.
- Liability payment detail sums exactly to the journal amount.

## 2. Gold distribution business examples

### H. Purchase business inventory

Business buys 10 pieces of a product at Rp1,000,000 each. Total purchase = Rp10,000,000.

| Ledger account | Debit | Credit |
|---|---:|---:|
| Business inventory | 10,000,000 | — |
| Business bank/cash | — | 10,000,000 |
| **Total** | **10,000,000** | **10,000,000** |

Expected:
- A purchase business document and 10-unit inbound inventory movement are created.
- A purchase cost layer is available for subsequent FIFO allocation.
- Personal investment assets remain unchanged.

### I. Sell 4 pieces

Sale price is Rp1,200,000 per piece, total revenue Rp4,800,000. The FIFO purchase cost for the 4 pieces is Rp4,000,000.

| Ledger account | Debit | Credit |
|---|---:|---:|
| Business bank/cash | 4,800,000 | — |
| Sales revenue — Business | — | 4,800,000 |
| Cost of goods sold | 4,000,000 | — |
| Business inventory | — | 4,000,000 |
| **Total** | **8,800,000** | **8,800,000** |

Expected:
- Sales revenue = Rp4,800,000.
- COGS = Rp4,000,000.
- Gross profit = Rp800,000.
- Inventory quantity decreases by 4.
- FIFO cost allocations identify the original purchase movement(s).
- Household income is not automatically increased by sales revenue or gross profit.

### J. Business operating expense

Business pays Rp100,000 for packaging/operations.

| Ledger account | Debit | Credit |
|---|---:|---:|
| Business operating expense | 100,000 | — |
| Business bank/cash | — | 100,000 |
| **Total** | **100,000** | **100,000** |

Expected:
- Business net profit is reduced Rp100,000.
- Expense is associated with the business.
- The expense is not automatically classified as household operating spend.

### K. Owner withdrawal / transfer to personal account

Business transfers Rp500,000 from business bank to BCA Istri.

| Ledger account | Debit | Credit |
|---|---:|---:|
| Bank — BCA Istri | 500,000 | — |
| Business bank/cash | — | 500,000 |
| **Total** | **500,000** | **500,000** |

Expected:
- Internal transfer from business cash to personal household cash.
- Business revenue and profit are unchanged.
- No duplicate household income is created.
- The event is labelled as owner withdrawal in the business subledger for reporting.

## 3. Budget and allocation behavior

### L. Monthly budget performance

A monthly Kitchen budget is Rp1,000,000. Posted kitchen expense journal lines total Rp350,000.

Expected:
- Budget used = Rp350,000.
- Budget remaining = Rp650,000.
- Budget data is planning data; it does not create ledger entries.
- Reversing an expense reduces actual spend in the period according to the reversal date/reporting rule.

### M. Planned income allocation

An allocation run distributes Rp10,000,000 salary across:
- Household operations: Rp4,000,000
- Fixed savings: Rp2,000,000
- Husband allowance: Rp2,000,000
- Wife allowance: Rp2,000,000

Expected:
- Allocation lines total exactly Rp10,000,000.
- The allocation run is a planning record only.
- Account balances do not change until actual transfers/expenses are entered.
- Changing the future allocation plan does not rewrite prior confirmed allocation runs.

## 4. Correction and audit examples

### N. Incorrect posted expense

A posted expense was Rp350,000 but should have been Rp305,000.

Expected:
1. Original posted journal remains unchanged.
2. A reversal entry is posted for Rp350,000, linked to the original entry.
3. A corrected expense entry is posted for Rp305,000.
4. Both entries record the acting user and timestamps.
5. Audit history shows the correction chain.

A direct UPDATE or DELETE of posted journal lines must fail.

### O. Unbalanced journal attempt

Attempt to post debit Rp100,000 and credit Rp99,999.

Expected:
- Posting is rejected at the database layer.
- No posted transaction, account balance change, or partial journal survives the transaction.
- The error identifies an unbalanced journal.
- The browser cannot bypass this using direct API access.

## 5. Security acceptance tests

| Test | Expected outcome |
|---|---|
| Anonymous request selects a financial table | Denied by SQL grants and/or RLS |
| Authenticated user without an approved membership | No household rows visible; writes rejected |
| Husband reads household transactions | Allowed |
| Wife reads same household transactions | Allowed |
| Husband updates a shared household transaction | Allowed and actor recorded as husband Auth user |
| Wife updates a shared household transaction | Allowed and actor recorded as wife Auth user |
| Third user attempts membership insertion | Denied; no third membership possible |
| User edits their own `user_metadata` to claim spouse/role | No change to authorization |
| User changes a row's `household_id` to another value | Rejected by RLS and/or immutable ownership check |
| User accesses receipt path belonging to unrelated household | Denied by Storage RLS |
| User invokes internal membership helper as an RPC | Not exposed; execute privilege limited |
| User directly modifies a posted journal line | Rejected |
| User submits unbalanced journal lines | Rejected at posting |
| User accesses SIM-SPPG project data | No FINANCIA database path or credential grants that access |

## 6. Reporting reconciliation checks

The reporting layer must reconcile these totals:

- **Account balance:** opening balances + posted debit/credit movement on the financial-account ledger dimensions.
- **Household income:** posted credit postings to household income accounts, excluding internal transfers and liability proceeds.
- **Household expense:** posted debit postings to expense accounts, excluding transfers, asset acquisitions, and principal liability repayments.
- **Business revenue:** sales revenue only, not purchase/sale cash turnover.
- **Business gross profit:** business revenue minus COGS.
- **Business net profit:** gross profit minus business operating expenses and other applicable business expenses.
- **Net worth:** household asset values minus liability balances; display historical cost and current market valuation separately.
- **Savings growth:** net movement in designated savings accounts/goals, not merely planned allocations.

## 7. Decisions and assumptions for implementation

1. **Currency:** IDR is the only active currency for launch; fields retain a currency code for future extensibility.
2. **Journal model:** one journal entry per user-facing transaction for the first release.
3. **Assets:** holdings can be recorded as individual lots; aggregated views combine lots by asset/product.
4. **Inventory cost:** FIFO lot allocation is the proposed gold-business method. Review before business inventory is enabled.
5. **Valuation:** market prices affect displayed portfolio valuation and unrealized P/L; they do not post cash journal lines automatically.
6. **Owner withdrawal:** internal transfer to a personal account is not household income; the business subledger separately records it as a withdrawal event.
7. **Corrections:** posted journals are reversed and re-posted; no silent mutation.
8. **Auth:** exactly two invited Auth identities are provisioned administratively; self-service signup is disabled.

These acceptance cases will become SQL/RPC tests and application-level integration tests in the migration and core-finance batches.
