# FINANCIA — Authentication Runbook

**Scope:** Phase 2 — Authentication and two-member household provisioning  
**Application model:** One private household, exactly two approved people  
**Current routes:** `/login`, `/auth/callback`, `/reset-password`, `/dashboard`

## 1. Implemented in the repository

- Typed Supabase browser client using the project-generated database types.
- PKCE sign-in with email and password.
- Invite / email-token callback handling.
- Password recovery and password update flow.
- Protected dashboard route that validates the authenticated user.
- Dashboard data query uses the database RLS policy to look for a household visible to that user.
- No public registration form or `auth.signUp()` call is exposed by the application.
- The client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never place a service-role or secret key in the browser.

## 2. Hosted Supabase settings still requiring verification

The values in `supabase/config.toml` are local development settings. They do not automatically update the hosted Supabase project's Auth configuration.

Before inviting anyone, verify the hosted project's Auth settings:

1. Disable new user signups / public registration.
2. Keep email/password provider enabled.
3. Require email confirmation for newly invited identities where the hosted invite flow supports it.
4. Use a production-ready SMTP sender for invitation and password-reset mail if required by the project's email delivery setup.
5. Configure the Site URL to the deployed FINANCIA origin when it exists.
6. Add exact redirect URLs:
   - `http://localhost:3000/auth/callback` for local development.
   - `https://<production-host>/auth/callback` after Cloudflare Pages deployment.

Do not configure a wildcard redirect for production.

## 3. Invite exactly two Auth users

The intended identities are:

- `husband` — the husband's email identity.
- `wife` — the wife's email identity.

Use the Supabase Auth administrative invite flow to invite only these two people. They set their own passwords through the emailed invitation. Do not share or store either person's password in chat or GitHub.

The currently connected Supabase tools do not expose an Auth admin invitation operation or a hosted Auth settings update operation. The invite action and hosted signup toggle must therefore be completed in the Supabase Dashboard unless a suitable Auth admin connector is added.

After both invitations are accepted, record each user's Auth UUID from the Users view. The client application must never create household membership rows.

## 4. Household provisioning after both users exist

Provisioning is an administrative database operation. It must:

1. Confirm exactly two intended Auth UUIDs exist and belong to the two invited email identities.
2. Create the single household row using `singleton_key = 1`.
3. Insert the husband membership with `person_key = 'husband'` and `membership_status = 'active'`.
4. Insert the wife membership with `person_key = 'wife'` and `membership_status = 'active'`.
5. Record the administrator / provisioning actor where the schema supports it.
6. Verify both membership rows and the household row.
7. Verify that both users have identical access.

Do not insert memberships from a browser client. The application-level owner attribution (`husband`, `wife`, `shared`) is not an authorization role.

## 5. Acceptance tests after provisioning

Run these checks using authenticated sessions for both invited users:

- Husband can read the shared household and financial records.
- Wife can read the same shared household and financial records.
- Husband can create/update permitted draft records and wife can see the changes.
- Wife can create/update permitted draft records and husband can see the changes.
- Neither user can add a third household member or change another member's identity/status.
- An unauthorised third Auth user with no membership cannot read household or financial rows.
- Both users can only post balanced journal entries.
- Posted journals and lines cannot be edited or deleted; corrections use reversal entries.
- Sign-out invalidates the browser session and the protected dashboard redirects to login.

No Auth identities or household records currently exist in the hosted database, so these live-session tests remain pending.
