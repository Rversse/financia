# FINANCIA — Phase 2 Implementation Status

**Last verified:** 2026-11-23  
**Supabase project:** `financia` (`tjutcenodmowkfviwrpd`)  
**PostgreSQL:** 17.12 · **Region:** Singapore

## Applied migration history

The following migrations are present in Supabase's `supabase_migrations.schema_migrations` history:

| Remote version | Migration |
|---|---|
| `20261123092241` | `phase2_household_ledger_foundation` |
| `20261123092545` | `phase2_security_and_index_hardening` |
| `20261123092956` | `phase2_finance_domains_and_audit` |
| `20261123093101` | `phase2_finance_domain_fk_indexes` |

The repository migration filenames are aligned to these remote versions so a linked Supabase CLI workspace will not try to replay applied DDL.

## Verified database state

| Check | Result |
|---|---:|
| Public application tables | 32 |
| Tables with RLS enabled | 32 / 32 |
| Tables with RLS forced | 0 |
| Public-table privileges granted to `anon` | 0 |
| Household rows | 0 |
| Household membership rows | 0 |
| Supabase Auth users | 0 |
| Private receipt bucket | Not created |
| Security Advisor findings | 0 |
| Performance Advisor | Unused-index notices only |

RLS uses `private.is_household_member(household_id)`, which checks the authenticated user's active household membership. Both spouses receive the same access; `person_key` and asset/account ownership are attribution fields, not authorization roles.

The `public.rls_auto_enable()` event-trigger function is executable only by `postgres`. Its event trigger remains enabled to automatically activate RLS on new public tables.

The unused-index notices are expected while all application tables are empty. Do not remove those indexes until there is representative workload and query-plan evidence.

## Important boundaries

- The database contains no household or user data yet.
- The Auth user-created trigger creates a profile only; it does not create or activate a household membership.
- The application must not permit self-service registration or self-service membership creation.
- The local `supabase/config.toml` now disables public signup and automatic Data API exposure. This is a local development configuration; it does **not** prove that the hosted project's Auth signup setting has been changed.
- The `receipts` table references the intended private bucket name `financia-private`, but that bucket does not exist yet. Receipt upload is not ready and must wait for the Smart Capture / Storage batch.
- No service-role key, database password, or secret belongs in this public repository.

## Authentication application status

The repository now includes the typed Supabase browser client, invite-only sign-in UI, PKCE/token callback, protected dashboard route, and password reset flow. The client contains no public signup operation.

See [Authentication Runbook](../authentication-runbook.md) for hosted Auth settings, invite flow, household provisioning, and acceptance tests.

## Remaining Phase 2 work

1. Verify hosted Auth settings: disable self-service signup, retain email/password for invited users, and configure the production Site URL / exact redirect URLs after the app URL exists.
2. Collect the two intended email addresses and invite the husband and wife identities.
3. Provision one household and exactly two active membership rows, one `husband` and one `wife`.
4. Test both members can access shared data equally, cannot change membership, and an unauthorised third user sees no household records.
5. Exercise balanced posting, transfer, reversal, and immutable posted-journal paths against real authenticated sessions.
6. Run advisors after any final database hardening.

Do not create a third user or allow membership rows to be inserted from the browser.
