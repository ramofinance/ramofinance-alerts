# RAMO Finance Radar v3.4.1

## Permanent admin visibility repair

- Reasserts the project owner as ADMIN through a new additive Prisma migration using the stable Telegram identity and the canonical admin username.
- Adds runtime self-healing: every authenticated user lookup restores ADMIN for the configured/built-in owner identity if a stale database row says otherwise.
- Keeps environment-based admin usernames/IDs and all manually assigned admins.
- Does not remove or replace Radar v3.4.0 Gem features, filters, tooltips, invitations or access management.
- Prevents future Radar UI releases from depending solely on a one-time historical migration for owner visibility.
