# FINANCIA Database Architecture — Phase 2

**Status:** Discovery and architecture baseline  
**Reviewed:** 2026-11-23  
**Supabase project:** `financia` (`tjutcenodmowkfviwrpd`)  
**PostgreSQL:** 17.12  
**Region:** `ap-southeast-1` (Singapore)

This document records the current database audit and the architectural direction for the next database-design steps. It is not a migration and does not change the live schema.

## 1. Current database audit

| Item | Observed state |
|---|---|
| Supabase project | `financia` |
| Project status | `ACTIVE_HEALTHY` |
| PostgreSQL | 17.12 |
| Application tables in `public` | None |
| Application views/sequences in `public` | None |
| Supabase migration history | Empty |
| Auth users | 0 |
| Business data | None |
| RLS auto-enable event trigger | Present and enabled |
| Automatic Data API grants | Not enabled for newly created tables |
| Automatic RLS on new `public` tables | Enabled |

System schemas such as `auth`, `storage`, and `realtime` contain Supabase-managed objects. They are not application tables and must not be altered as part of FINANCIA schema work.

### Existing RLS helper finding

The database contains:

- Event trigger: `ensure_rls`
- Event: `ddl_command_end`
- Watched DDL: `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`
- Function: `public.rls_auto_enable()`
- Function type: `event_trigger`
- Owner: `postgres`
- Function security mode: `SECURITY DEFINER`
- Function search path: `pg_catalog`
- Default function ACL currently includes `PUBLIC EXECUTE`

Supabase Security Advisor reports warnings for anonymous and authenticated execution of this function. It is the helper attached to the existing RLS auto-enable event trigger. Do not drop the event trigger or helper casually: its operational role must be preserved while the function's direct execution privileges are reviewed and restricted. The advisor finding should be addressed and re-tested during the security/migration stage.

### Data API grant baseline

The project was created with automatic API access to new tables disabled. Since 2026-10-30, new tables in `public` require explicit PostgreSQL grants before PostgREST / the Supabase Data API can access them. A grant and an RLS policy are separate controls:

- GRANT determines whether a database role can access an object.
- RLS determines which rows that role can access.

FINANCIA migrations must therefore explicitly grant only the operations required by `authenticated`. No financial table should be granted to `anon`.

## 2. Product and authorization boundary

FINANCIA is a private, single-household application for exactly two invited people.

- There is one household data space, not a public SaaS and not a multi-tenant product.
- Husband and wife have equal application permissions.
- The person who owns an account or asset is a financial attribution, not an authorization role.
- Each write records the authenticated actor separately from the financial owner attribution.
- Client-side registration must not create arbitrary new household members.

### Household access model

The schema should include a household record and exactly two approved membership records linked to Supabase Auth user IDs.

Every household-owned business table carries a `household_id`. An authenticated request may access a row only when the caller has a membership for that row's household.

Membership bootstrap is an administrative operation, not a self-service insert exposed to normal clients. The membership table should expose only the current user's own membership row for client-side checks; users must not be able to add themselves, add a third member, or change another member's identity.

Both members can view and manage shared household records regardless of which spouse is recorded as the financial owner.

### Separate the actor from the owner

Use these concepts independently:

- **Actor:** `created_by`, `updated_by`, and audit events reference `auth.users.id`.
- **Financial owner:** a constrained value representing `husband`, `wife`, or `shared`.
- **Household scope:** `household_id`, used by RLS to establish shared-family access.

Do not use Supabase `user_metadata` as an authorization source. It is user-editable.

## 3. Accounting model

### Decision: use a ledger-backed, double-entry model

FINANCIA should use a balanced journal ledger as the authoritative source for money movement. A single mutable account balance or a flat income/expense list is not sufficient for the required combination of:

- Transfers between family accounts without double-counting income or expenses.
- Asset purchases and sales that move value between cash and asset holdings.
- Liability balances and principal repayments.
- Business inventory, cost of goods sold, revenue, expenses, and owner withdrawals.
- Corrections with traceable history.

The interface can remain simple and present user-facing transactions. The database should preserve their accounting effect as balanced debit/credit postings.

### Conceptual layers

1. **Financial accounts** — real-world BCA, other bank accounts, e-wallets, cash wallets, and joint accounts. Each has an owner attribution and maps to an appropriate ledger account.
2. **Chart of accounts** — ledger accounts grouped as assets, liabilities, equity, income, and expenses.
3. **Transactions** — user-facing events such as income, expense, transfer, asset purchase/sale, liability payment, and business activity.
4. **Journal entries and lines** — the accounting postings generated by a transaction. Each posted journal must balance: total debits equal total credits.
5. **Assets and valuations** — physical or investment holdings with quantity/weight, acquisition cost, owner attribution, and separate dated market valuations.
6. **Liabilities and payments** — outstanding obligations and their settlement history, linked to the ledger.
7. **Business inventory and movements** — trading stock kept separate from personal investment holdings. Revenue is not family income until the business records profit and/or an owner withdrawal according to the accounting model.
8. **Audit history** — actor, timestamp, and change context for significant changes.

### Accounting invariants

- A transfer between two household financial accounts posts debit and credit lines only; it is neither household income nor household expense.
- An asset purchase transfers value from cash/bank to an asset ledger account; it is not consumption.
- An asset valuation change is a valuation event, not a cash transaction.
- A debt repayment separates principal reduction from interest/fees where applicable.
- Business turnover is not treated as net business profit or household income.
- Posted ledger records are not silently overwritten or deleted. A correction is recorded through a traceable reversal/adjustment.
- Journal balance validation must be enforced by PostgreSQL, not only by the browser.

### Numeric precision

Use PostgreSQL `NUMERIC` types for currency and quantities. Do not use binary floating-point types for money.

Initial precision proposal for the ERD stage:

- IDR amounts: `NUMERIC(20,2)`
- Asset weights / quantities: a higher precision such as `NUMERIC(20,6)`
- Market prices and unit rates: precision selected per instrument and source

The final data dictionary will make each precision and rounding rule explicit. Store currency codes even if IDR is the only active currency at launch.

## 4. Security baseline

- Enable RLS on every application table in the exposed `public` schema.
- Add explicit, operation-specific RLS policies. `TO authenticated` by itself is not authorization.
- Use a household membership predicate so both approved members can access the same household data.
- Keep `anon` away from financial tables.
- Add explicit table and sequence grants in each migration; do not rely on default Data API exposure.
- Avoid broad `SECURITY DEFINER` functions. Where a privileged function is genuinely necessary, put it in a non-exposed schema, harden its search path, check `auth.uid()`, revoke default PUBLIC execution, and grant only the intended role.
- Never place a service-role key, database password, or secret key in browser code or `NEXT_PUBLIC_*` variables.
- Keep all write paths auditable. Revoke or restrict direct mutation of posted ledger rows where required by the final model.

## 5. Planned schema domains

The ERD and data dictionary will refine the exact table names and relationships. Current candidate domains:

| Domain | Main responsibilities |
|---|---|
| Identity & household | Household, members, profiles |
| Accounts & ledger | Financial accounts, chart of accounts, transactions, journal entries, journal lines |
| Classification | Categories, income sources, allocation/budget classifications |
| Budgeting | Budget periods, budget lines, allocations, savings goals |
| Assets | Asset register, asset valuations, asset movements |
| Liabilities | Liability register, payment schedule, settlement postings |
| Business | Businesses, products, inventory, inventory movements, business expenses, owner withdrawals |
| Capture & evidence | Receipts, attachments, import/extraction records |
| Audit | Audit events and correction/reversal links |
| Market data | Price observations, source, timestamp, buyback/sell prices |

These are conceptual domains, not a commitment to create one table for every listed noun. Avoid duplicating values that can be derived safely from the ledger.

## 6. Design artifacts

The detailed Phase 2 design batch is maintained in separate reviewed documents:

- [Entity Relationship Diagram](./erd.md)
- [Data Dictionary](./data-dictionary.md)
- [Accounting Scenario Validation](./scenario-validation.md)

These artifacts define the table-level proposal, data types, constraints, relationships, and acceptance examples. They do not represent live database changes.

## 7. Next steps — not yet applied

1. Produce a full ERD and a data dictionary with table keys, ownership, types, checks, foreign keys, unique constraints, indexes, and lifecycle rules.
2. Review the ERD against real examples for transfers, household spending, income allocation, asset purchase/sale, liability payment, and gold distribution business operations.
3. Create versioned SQL migrations using the supported Supabase CLI migration workflow.
4. Apply and verify schema, explicit GRANTs, RLS policies, constraints, and indexes.
5. Provision two invited users through an administrative flow and verify equal access plus denial for any third/unapproved user.
6. Run security and performance advisors, including the existing `rls_auto_enable()` finding.

**No application schema, table, policy, migration, user, or production data was changed during this discovery step.**
