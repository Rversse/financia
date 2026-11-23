# FINANCIA — Data Dictionary (Proposed)

**Batch 1 / Phase 2 — design artifact only**  
**Version:** 1.0 · **Date:** 2026-11-23

This is the proposed catalog for the FINANCIA relational schema. All table definitions remain subject to migration-level SQL review. No table has been created in the live project by this document.

## 1. Global conventions

| Convention | Standard |
|---|---|
| Primary keys | `UUID`, generated with `gen_random_uuid()` |
| Household scope | `household_id UUID NOT NULL` on household-owned records |
| Monetary amount | `NUMERIC(20,2)` |
| Metal price / unit rate | `NUMERIC(20,4)` |
| Quantity / weight | `NUMERIC(20,6)` |
| Currency | `CHAR(3)`, default `IDR` |
| Event timestamp | `TIMESTAMPTZ`, stored as UTC |
| Calendar date / period | `DATE` |
| Flexible source metadata | `JSONB`, only where a stable relational column is not suitable |
| Actor | `UUID` referencing `auth.users(id)` |
| Owner attribution | `TEXT` constrained to `husband`, `wife`, `shared` |
| Naming | `snake_case`; plural table names |
| Soft delete | Use explicit status/archival where useful; never soft-delete or silently rewrite posted ledger lines |

Every household-scoped foreign key should be composite where practical: `(household_id, referenced_id)` references a unique pair on the parent table. This prevents a row in one household from referencing a record in another household even when application code is faulty.

## 2. Identity and household

### `households`

One row for this private family. A unique singleton key prevents creating a second household in this project.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `singleton_key` | SMALLINT | NOT NULL, UNIQUE, CHECK = 1 |
| `name` | TEXT | NOT NULL; e.g. "Keluarga" |
| `base_currency` | CHAR(3) | NOT NULL, default `IDR` |
| `timezone` | TEXT | NOT NULL, default `Asia/Jakarta` |
| `created_by` | UUID | FK `auth.users.id` |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()` |

Constraint: at most one household row in the database. The application is ready for normal use only after exactly two active members are provisioned.

### `profiles`

Application-facing profile details for a Supabase Auth identity. Not an authorization source.

| Column | Type | Rules / meaning |
|---|---|---|
| `user_id` | UUID | PK, FK `auth.users.id`, ON DELETE RESTRICT |
| `display_name` | TEXT | NOT NULL |
| `avatar_path` | TEXT | Nullable private Storage path |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

### `household_members`

Connects each Auth user to the household and identifies which spouse the person represents. This is financial attribution, not a role hierarchy.

| Column | Type | Rules / meaning |
|---|---|---|
| `household_id` | UUID | FK `households.id`, NOT NULL |
| `user_id` | UUID | FK `profiles.user_id`, NOT NULL, UNIQUE globally |
| `person_key` | TEXT | CHECK in `husband`, `wife` |
| `membership_status` | TEXT | CHECK in `invited`, `active`, `suspended` |
| `invited_by` | UUID | Nullable FK `auth.users.id` |
| `joined_at` | TIMESTAMPTZ | Nullable until activated |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Keys: PK `(household_id, user_id)`; UNIQUE `(household_id, person_key)`; UNIQUE `user_id`. These constraints cap membership at two identities: one husband and one wife. The invitation/provisioning flow must prevent an ordinary client from inserting or changing membership rows.

## 3. Ledger and financial accounts

### `ledger_accounts`

Chart of Accounts. Every account has one accounting class and a normal balance side.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household, NOT NULL |
| `account_code` | TEXT | NOT NULL; unique within household |
| `account_name` | TEXT | NOT NULL |
| `account_class` | TEXT | CHECK in `asset`, `liability`, `equity`, `income`, `expense` |
| `normal_side` | TEXT | CHECK in `debit`, `credit` |
| `parent_account_id` | UUID | Nullable self-FK, same household |
| `is_system` | BOOLEAN | NOT NULL, default false |
| `is_postable` | BOOLEAN | NOT NULL, default true |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Constraints: UNIQUE `(household_id, account_code)`; UNIQUE `(household_id, id)`; parent must belong to same household and cannot equal the row itself.

### `financial_accounts`

Real-world cash/bank/e-wallet accounts. One operational account maps to one ledger account; current balance is derived from posted journal lines.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household, NOT NULL |
| `ledger_account_id` | UUID | FK ledger account, UNIQUE within household |
| `account_name` | TEXT | NOT NULL; user-facing label |
| `account_type` | TEXT | CHECK in `bank`, `e_wallet`, `cash`, `deposit`, `other` |
| `provider_name` | TEXT | Nullable bank/provider |
| `owner_attribution` | TEXT | CHECK in `husband`, `wife`, `shared` |
| `account_number_last4` | CHAR(4) | Nullable; last four digits only |
| `currency_code` | CHAR(3) | NOT NULL, default `IDR` |
| `opening_balance_amount` | NUMERIC(20,2) | NOT NULL, default 0 |
| `opening_balance_at` | TIMESTAMPTZ | NOT NULL |
| `opening_balance_transaction_id` | UUID | Nullable FK `transactions.id`; records the opening journal source |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_by` | UUID | FK Auth user |
| `created_at` | TIMESTAMPTZ | NOT NULL |

No mutable `current_balance` column. Opening balance metadata must be reconciled to one posted opening-balance journal entry; subsequent balance is derived from the ledger.

### `transaction_categories`

Household income/expense categories.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household, NOT NULL |
| `category_key` | TEXT | Stable seed / lookup key |
| `category_name` | TEXT | NOT NULL |
| `category_type` | TEXT | CHECK in `income`, `expense` |
| `parent_category_id` | UUID | Nullable self-FK, same household |
| `is_system` | BOOLEAN | NOT NULL, default false |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `sort_order` | INTEGER | NOT NULL, default 0 |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Constraints: UNIQUE `(household_id, category_key)` where key is present; UNIQUE `(household_id, category_name, category_type)`.

### `transactions`

User-facing financial event. Its exact amount is derived from the linked journal, not kept as a second authoritative balance.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household, NOT NULL |
| `transaction_type` | TEXT | CHECK in `income`, `expense`, `transfer`, `asset_purchase`, `asset_sale`, `liability_incurred`, `liability_payment`, `business_purchase`, `business_sale`, `business_expense`, `owner_withdrawal`, `opening_balance`, `adjustment` |
| `category_id` | UUID | Nullable FK category, same household |
| `owner_attribution` | TEXT | CHECK in `husband`, `wife`, `shared` |
| `occurred_at` | TIMESTAMPTZ | NOT NULL |
| `description` | TEXT | NOT NULL |
| `notes` | TEXT | Nullable |
| `status` | TEXT | CHECK in `draft`, `posted`, `voided` |
| `created_by` | UUID | FK Auth user, NOT NULL |
| `updated_by` | UUID | Nullable FK Auth user |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |
| `voided_at` | TIMESTAMPTZ | Nullable |
| `voided_by` | UUID | Nullable FK Auth user |

Indexes: `(household_id, occurred_at DESC)`, `(household_id, transaction_type, occurred_at DESC)`, `(household_id, status)`.

### `journal_entries`

One accounting entry per transaction. Posted entries are immutable and corrected by reversal.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household, NOT NULL |
| `transaction_id` | UUID | FK transaction, UNIQUE, NOT NULL |
| `entry_date` | DATE | NOT NULL |
| `memo` | TEXT | Nullable |
| `status` | TEXT | CHECK in `draft`, `posted`, `reversed` |
| `reversal_of_entry_id` | UUID | Nullable self-FK, same household, UNIQUE |
| `posted_at` | TIMESTAMPTZ | Nullable |
| `posted_by` | UUID | Nullable FK Auth user |
| `created_at` | TIMESTAMPTZ | NOT NULL |

A deferred/transactional posting validator must require at least two lines, debit total = credit total, and a valid household membership actor.

### `journal_lines`

Atomic debit/credit postings. All amounts are positive; exactly one side is populated per line.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household, NOT NULL |
| `journal_entry_id` | UUID | FK journal entry, same household |
| `line_number` | INTEGER | NOT NULL |
| `ledger_account_id` | UUID | FK ledger account, same household |
| `financial_account_id` | UUID | Nullable FK financial account, same household |
| `category_id` | UUID | Nullable FK category, same household |
| `asset_id` | UUID | Nullable FK asset, same household |
| `liability_id` | UUID | Nullable FK liability, same household |
| `business_id` | UUID | Nullable FK business, same household |
| `debit_amount` | NUMERIC(20,2) | NOT NULL, default 0 |
| `credit_amount` | NUMERIC(20,2) | NOT NULL, default 0 |
| `description` | TEXT | Nullable |

Constraints: UNIQUE `(journal_entry_id, line_number)`; exactly one of debit/credit must be greater than zero; both amounts must be non-negative. Posted lines cannot be updated or deleted. Required dimensions depend on the ledger account class and transaction type.

## 4. Allocation, budget, and savings

### `allocation_plans`

Named allocation configurations with effective dates.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household, NOT NULL |
| `plan_name` | TEXT | NOT NULL |
| `effective_from` | DATE | NOT NULL |
| `effective_to` | DATE | Nullable, >= effective_from |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_by` | UUID | FK Auth user |
| `created_at` | TIMESTAMPTZ | NOT NULL |

### `allocation_buckets`

Planning destinations such as household operations, savings, husband allowance, wife allowance, business reserve, or custom.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `plan_id` | UUID | FK allocation plan, same household |
| `bucket_name` | TEXT | NOT NULL |
| `bucket_type` | TEXT | CHECK in `household_operating`, `savings`, `husband_allowance`, `wife_allowance`, `business_reserve`, `custom` |
| `owner_attribution` | TEXT | Nullable CHECK `husband`, `wife`, `shared` |
| `sort_order` | INTEGER | NOT NULL, default 0 |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Buckets are planning labels; they do not themselves hold cash.

### `allocation_rules`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `plan_id` | UUID | FK allocation plan |
| `bucket_id` | UUID | FK bucket |
| `rule_method` | TEXT | CHECK in `fixed_amount`, `percentage`, `manual` |
| `fixed_amount` | NUMERIC(20,2) | Nullable, >= 0 |
| `percentage_value` | NUMERIC(7,4) | Nullable, 0–100 |
| `priority` | INTEGER | NOT NULL, default 0 |
| `is_active` | BOOLEAN | NOT NULL, default true |

A constraint requires exactly the value appropriate to the selected method. Percentage totals are validated by the plan/run logic, not a row-level CHECK.

### `allocation_runs`

A proposed allocation of one income transaction. Confirmation means the allocation snapshot is accepted; it does not create bank transfers.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `plan_id` | UUID | FK allocation plan |
| `source_transaction_id` | UUID | FK transaction |
| `status` | TEXT | CHECK in `draft`, `confirmed`, `cancelled` |
| `source_amount` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `unallocated_amount` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `created_by` | UUID | FK Auth user |
| `confirmed_by` | UUID | Nullable FK Auth user |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `confirmed_at` | TIMESTAMPTZ | Nullable |

### `allocation_run_lines`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `allocation_run_id` | UUID | FK allocation run |
| `bucket_id` | UUID | FK allocation bucket |
| `allocated_amount` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `rule_snapshot` | JSONB | NOT NULL; records rule used at calculation time |

Constraint: sum of lines plus unallocated amount equals source amount when the run is confirmed.

### `budget_periods`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `period_start` | DATE | NOT NULL; normally first day of month |
| `period_end` | DATE | NOT NULL, >= period_start |
| `period_name` | TEXT | NOT NULL |
| `status` | TEXT | CHECK in `draft`, `active`, `closed` |
| `created_by` | UUID | FK Auth user |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Constraint: UNIQUE `(household_id, period_start)`.

### `budget_lines`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `budget_period_id` | UUID | FK budget period |
| `category_id` | UUID | FK expense category |
| `budget_amount` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `rollover_enabled` | BOOLEAN | NOT NULL, default false |
| `notes` | TEXT | Nullable |

Constraint: UNIQUE `(budget_period_id, category_id)`. Actual spend is derived from posted expense journal lines assigned to the category.

### `savings_goals`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `goal_name` | TEXT | NOT NULL |
| `target_amount` | NUMERIC(20,2) | NOT NULL, > 0 |
| `target_date` | DATE | Nullable |
| `owner_attribution` | TEXT | CHECK in `husband`, `wife`, `shared` |
| `linked_financial_account_id` | UUID | Nullable FK financial account |
| `status` | TEXT | CHECK in `active`, `completed`, `paused`, `cancelled` |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Goal progress is derived from linked account(s) or explicitly linked savings movements; do not duplicate a manually updated current amount.

## 5. Assets and liabilities

### `assets`

One asset holding or acquisition lot. Personal investment holdings and business inventory must remain separate.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `ledger_account_id` | UUID | FK asset ledger account |
| `asset_kind` | TEXT | CHECK in `gold`, `silver`, `vehicle`, `property`, `deposit`, `investment`, `other` |
| `asset_name` | TEXT | NOT NULL |
| `owner_attribution` | TEXT | CHECK in `husband`, `wife`, `shared` |
| `quantity` | NUMERIC(20,6) | NOT NULL, >= 0 |
| `quantity_unit` | TEXT | NOT NULL, e.g. `gram`, `piece`, `unit` |
| `weight_grams` | NUMERIC(20,6) | Nullable, >= 0 |
| `acquired_at` | TIMESTAMPTZ | Nullable |
| `acquisition_cost` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `currency_code` | CHAR(3) | NOT NULL, default `IDR` |
| `status` | TEXT | CHECK in `active`, `disposed`, `archived` |
| `notes` | TEXT | Nullable |
| `created_by` | UUID | FK Auth user |
| `created_at` | TIMESTAMPTZ | NOT NULL |

### `asset_movements`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `asset_id` | UUID | FK asset |
| `transaction_id` | UUID | Nullable FK transaction |
| `movement_type` | TEXT | CHECK in `acquisition`, `disposal`, `addition`, `quantity_adjustment`, `transfer_owner` |
| `quantity_delta` | NUMERIC(20,6) | NOT NULL, signed |
| `cost_amount` | NUMERIC(20,2) | NOT NULL, default 0 |
| `occurred_at` | TIMESTAMPTZ | NOT NULL |
| `created_by` | UUID | FK Auth user |

### `asset_valuations`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `asset_id` | UUID | FK asset |
| `valuation_at` | TIMESTAMPTZ | NOT NULL |
| `market_value` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `currency_code` | CHAR(3) | NOT NULL, default `IDR` |
| `valuation_source` | TEXT | NOT NULL |
| `unit_price` | NUMERIC(20,4) | Nullable |
| `notes` | TEXT | Nullable |
| `created_by` | UUID | FK Auth user |

### `liabilities`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `ledger_account_id` | UUID | FK liability ledger account |
| `liability_type` | TEXT | CHECK in `paylater`, `installment`, `loan`, `personal_debt`, `other` |
| `lender_name` | TEXT | NOT NULL |
| `description` | TEXT | NOT NULL |
| `owner_attribution` | TEXT | CHECK in `husband`, `wife`, `shared` |
| `incurred_at` | TIMESTAMPTZ | NOT NULL |
| `original_principal` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `due_date` | DATE | Nullable |
| `status` | TEXT | CHECK in `active`, `settled`, `cancelled` |
| `created_by` | UUID | FK Auth user |

Outstanding balance is derived from liability ledger postings, not a mutable balance field.

### `liability_payments`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `liability_id` | UUID | FK liability |
| `transaction_id` | UUID | FK transaction, UNIQUE |
| `principal_amount` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `interest_amount` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `fee_amount` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `paid_at` | TIMESTAMPTZ | NOT NULL |

Constraint: payment journal amount must equal principal + interest + fees. Principal reduces the liability; interest and fees are expenses.

## 6. Gold distribution business and inventory

### `businesses`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `business_name` | TEXT | NOT NULL |
| `business_type` | TEXT | NOT NULL; e.g. `gold_distribution` |
| `owner_attribution` | TEXT | CHECK in `husband`, `wife`, `shared` |
| `currency_code` | CHAR(3) | NOT NULL, default `IDR` |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `notes` | TEXT | Nullable |
| `created_by` | UUID | FK Auth user |
| `created_at` | TIMESTAMPTZ | NOT NULL |

### `business_products`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `business_id` | UUID | FK business |
| `sku` | TEXT | Nullable, unique within business when present |
| `product_name` | TEXT | NOT NULL |
| `product_kind` | TEXT | Nullable e.g. metal type / brand / purity |
| `quantity_unit` | TEXT | NOT NULL, e.g. `gram`, `piece` |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_at` | TIMESTAMPTZ | NOT NULL |

### `business_documents`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `business_id` | UUID | FK business |
| `transaction_id` | UUID | FK transaction, UNIQUE |
| `document_type` | TEXT | CHECK in `purchase`, `sale`, `business_expense`, `owner_withdrawal`, `return`, `adjustment` |
| `document_number` | TEXT | Nullable |
| `counterparty_name` | TEXT | Nullable |
| `document_at` | TIMESTAMPTZ | NOT NULL |
| `notes` | TEXT | Nullable |
| `created_by` | UUID | FK Auth user |

### `business_document_lines`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `business_document_id` | UUID | FK business document |
| `product_id` | UUID | FK business product |
| `quantity` | NUMERIC(20,6) | NOT NULL, > 0 |
| `unit_price` | NUMERIC(20,4) | NOT NULL, >= 0 |
| `line_total` | NUMERIC(20,2) | NOT NULL, >= 0 |
| `cost_of_goods_sold` | NUMERIC(20,2) | Nullable, populated for sales |
| `description` | TEXT | Nullable |

Line totals are validated against quantity × unit price using defined rounding rules. For sale documents, total COGS must equal the sum of FIFO cost allocations.

### `inventory_movements`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `business_id` | UUID | FK business |
| `product_id` | UUID | FK business product |
| `document_line_id` | UUID | Nullable FK business document line |
| `movement_type` | TEXT | CHECK in `purchase_in`, `sale_out`, `return_in`, `adjustment_in`, `adjustment_out` |
| `quantity_delta` | NUMERIC(20,6) | NOT NULL, signed |
| `unit_cost` | NUMERIC(20,4) | NOT NULL, >= 0 |
| `occurred_at` | TIMESTAMPTZ | NOT NULL |
| `created_by` | UUID | FK Auth user |

Stock on hand is derived by summing movements. Do not maintain a second manually updated stock balance.

### `inventory_cost_allocations`

Maps a sale's outgoing quantity to specific purchase-in movements for lot-level FIFO cost.

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `sale_document_line_id` | UUID | FK sale line |
| `source_purchase_movement_id` | UUID | FK purchase-in movement |
| `quantity_consumed` | NUMERIC(20,6) | NOT NULL, > 0 |
| `unit_cost_snapshot` | NUMERIC(20,4) | NOT NULL, >= 0 |
| `created_at` | TIMESTAMPTZ | NOT NULL |

The source movement must be an inbound purchase/return lot for the same household and product. Allocated quantity must not exceed the remaining quantity of the source lot.

## 7. Receipts, market prices, and audit

### `receipts`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `transaction_id` | UUID | Nullable FK transaction |
| `storage_bucket` | TEXT | NOT NULL, private bucket |
| `storage_path` | TEXT | NOT NULL, private object key |
| `original_filename` | TEXT | Nullable display-only metadata |
| `mime_type` | TEXT | NOT NULL |
| `file_size_bytes` | BIGINT | NOT NULL, > 0 |
| `sha256_hash` | TEXT | Nullable duplicate detection |
| `uploaded_by` | UUID | FK Auth user |
| `uploaded_at` | TIMESTAMPTZ | NOT NULL |

Constraint: UNIQUE `(storage_bucket, storage_path)`. The object itself is kept in a private Supabase Storage bucket protected by Storage RLS.

### `market_price_observations`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `instrument_kind` | TEXT | CHECK in `gold`, `silver` |
| `product_name` | TEXT | Nullable product / brand |
| `price_type` | TEXT | CHECK in `retail`, `buyback`, `spot` |
| `currency_code` | CHAR(3) | NOT NULL, default `IDR` |
| `unit_name` | TEXT | NOT NULL, e.g. `gram` |
| `price_per_unit` | NUMERIC(20,4) | NOT NULL, >= 0 |
| `source_name` | TEXT | NOT NULL |
| `source_url` | TEXT | Nullable |
| `observed_at` | TIMESTAMPTZ | NOT NULL |
| `fetched_at` | TIMESTAMPTZ | NOT NULL |
| `raw_metadata` | JSONB | Nullable provider response metadata |

The UI must show source and timestamp and must not label periodic quotations as real-time.

### `audit_events`

| Column | Type | Rules / meaning |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | UUID | FK household |
| `actor_user_id` | UUID | Nullable FK Auth user; null for system operations |
| `event_type` | TEXT | NOT NULL e.g. `INSERT`, `UPDATE`, `DELETE`, `POST`, `REVERSE` |
| `entity_table` | TEXT | NOT NULL |
| `entity_id` | UUID | NOT NULL; polymorphic reference |
| `before_data` | JSONB | Nullable |
| `after_data` | JSONB | Nullable |
| `request_id` | TEXT | Nullable correlation identifier |
| `occurred_at` | TIMESTAMPTZ | NOT NULL, default `now()` |

Audit events are written by controlled database triggers/functions, not by browser inserts. Reads are limited to household members. Audit rows are append-only.

## 8. Index and constraint baseline

Required indexes in addition to primary/unique indexes:

- Household membership: `(household_id, membership_status)` and unique `user_id`.
- Transactions: `(household_id, occurred_at DESC)`, `(household_id, transaction_type, occurred_at DESC)`.
- Journal entries: `(household_id, entry_date DESC)`, unique `transaction_id`.
- Journal lines: `(household_id, ledger_account_id)`, `(journal_entry_id, line_number)`, and dimension indexes used in reports.
- Budget periods: unique `(household_id, period_start)`.
- Asset valuations: `(household_id, asset_id, valuation_at DESC)`.
- Liability payments: `(household_id, liability_id, paid_at DESC)`.
- Business documents: `(household_id, business_id, document_at DESC)`.
- Inventory movements: `(household_id, product_id, occurred_at)`.
- Receipts: unique `(storage_bucket, storage_path)`, optional `sha256_hash` index per household.
- Market prices: `(household_id, instrument_kind, observed_at DESC)`.
- Audit events: `(household_id, occurred_at DESC)`, `(entity_table, entity_id)`.

Use partial indexes for active records or non-null optional keys where useful. Avoid adding speculative indexes to every column; validate against actual query patterns.

## 9. Deliberate exclusions

- No general-purpose `role` field distinguishing husband from wife.
- No public registration or third household member.
- No stored mutable account, asset, liability, or inventory current balance.
- No float/double precision columns for currency.
- No separate table for every transaction subtype unless it adds business-specific facts.
- No table with publicly granted `anon` permissions.
- No public Storage bucket for receipts or statements.
