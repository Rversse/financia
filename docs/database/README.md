# FINANCIA Database Documentation

Phase 2 database architecture, migrations, and security reference for the private household application.

## Documents

1. [Architecture and security baseline](./architecture.md)
2. [Entity Relationship Diagram](./erd.md)
3. [Data Dictionary](./data-dictionary.md)
4. [Accounting scenario validation](./scenario-validation.md)
5. [Live implementation status](./implementation-status.md)

## Live status — 23 November 2026

- [x] Database discovery and accounting architecture
- [x] ERD and data dictionary baseline
- [x] Four schema migrations applied to Supabase
- [x] 32 public application tables created
- [x] RLS enabled on all 32 application tables
- [x] Explicit grants; no application table grants to `anon`
- [x] RLS helper and event-trigger function execution restricted
- [x] Supabase Security Advisor returns no findings
- [ ] Two Auth users invited and confirmed
- [ ] One household and two active memberships provisioned
- [ ] Live two-user RLS isolation and write-path tests
- [ ] Private receipt Storage bucket and policies (deferred to Smart Capture batch)

The database contains no Auth users, household rows, or financial records yet. Do not use receipt uploads until the private bucket and its policies are implemented.
