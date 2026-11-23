# FINANCIA Database Documentation

Phase 2 design and migration reference for the private household database.

## Current design batch

1. [Architecture and security baseline](./architecture.md)
2. [Entity Relationship Diagram](./erd.md)
3. [Data Dictionary](./data-dictionary.md)
4. [Accounting scenario validation](./scenario-validation.md)

## Status

- [x] Database discovery audit
- [x] Accounting architecture baseline
- [x] Proposed ERD
- [x] Proposed data dictionary
- [x] Transaction, budget, asset, liability, and business scenario validation
- [ ] SQL migration authoring
- [ ] RLS and explicit grants
- [ ] Auth provisioning for exactly two approved users
- [ ] Database security and consistency tests

**Important:** The first batch is documentation/design only. No FINANCIA application tables, migrations, users, or RLS policies have been applied to the live Supabase project.
