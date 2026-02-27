# Domain Migration Runbook: `simuvaction.com` (Wix -> Vercel)

Last updated: 2026-02-27 12:14:49 UTC

## Objective

Point `simuvaction.com` to the production project `simulvaction-plateforme` on Vercel, then transfer registrar ownership from Wix to Vercel with no email interruption.

## Current State (Verified)

### Vercel project

- Project: `simulvaction-plateforme`
- Production URL: `https://simulvaction-plateforme.vercel.app`
- Domain added in Vercel: `simuvaction.com`
- Subdomain added in Vercel project: `www.simuvaction.com`

### Current DNS (Wix)

- Apex A records:
  - `185.230.63.107`
  - `185.230.63.171`
  - `185.230.63.186`
- `www`:
  - `CNAME cdn1.wixdns.net` (chain resolves to `34.160.37.117`)
- Nameservers:
  - `ns10.wixdns.net`
  - `ns11.wixdns.net`
- Observed at query time:
  - no apex `MX`
  - no apex `TXT` (including no `_dmarc` record)

## Phase 1: Cutover DNS Web (keep Wix registrar)

This is the fastest low-risk path and should be done before registrar transfer.

### 1) Update records in Wix DNS

Set web records to Vercel targets:

- `A simuvaction.com -> 76.76.21.21`
- `A www.simuvaction.com -> 76.76.21.21`

Notes:
- Remove/replace Wix web records for apex and `www`.
- Keep all non-web records unchanged (mail-related records must stay as-is if present in Wix UI).
- Set TTL to `300` during migration if Wix allows it.

### 2) Verify domain status in Vercel

Run:

```bash
vercel domains inspect simuvaction.com
vercel domains inspect www.simuvaction.com
```

Expected: domain becomes correctly configured (no nameserver mismatch warning if using A-record method).

### 3) Validate web routing

- `https://simuvaction.com` loads production Commons app.
- `https://www.simuvaction.com` loads site (then configure redirect in Vercel dashboard to canonical apex).

## Canonical Redirect (`www` -> apex)

Because CLI does not expose redirect toggles for this flow, set it in Vercel dashboard:

1. Open project `simulvaction-plateforme`.
2. Go to `Settings` -> `Domains`.
3. Set `simuvaction.com` as primary domain.
4. Configure `www.simuvaction.com` to redirect to `simuvaction.com` (308/301 default in Vercel UI).

## Phase 2: Stabilization Window (24-72h)

Monitor:
- Web availability on apex and `www`.
- SSL certificate issuance and renewal state.
- Email health (if active mailbox provider exists).

Recommended checks:

```bash
# DNS

dig simuvaction.com A +short
dig www.simuvaction.com A +short

# HTTP

curl -I https://simuvaction.com
curl -I https://www.simuvaction.com
```

## Phase 3: Registrar Transfer Wix -> Vercel

Do this only after web is stable.

### 1) In Wix domain panel

- Unlock domain
- Disable transfer lock/protection
- Request EPP/Auth code

### 2) In Vercel

Use transfer-in flow:

```bash
vercel domains transfer-in simuvaction.com
```

(or use Vercel dashboard Domains transfer flow)

### 3) During transfer

- Keep DNS zone functionally identical.
- Do not remove mail records.
- Avoid simultaneous DNS architecture changes.

## Phase 4: Post-Transfer Hardening

After transfer completion:

1. Confirm domain remains attached to `simulvaction-plateforme`.
2. Reconfirm web + SSL + redirects.
3. Reconfirm mail records are present exactly as required by mail provider.
4. Add/validate CAA records if policy requires certificate authority restrictions.

## Acceptance Checklist

- [ ] `simuvaction.com` serves Vercel production site.
- [ ] `www.simuvaction.com` redirects to apex.
- [ ] SSL valid and trusted.
- [ ] No mail disruption observed.
- [ ] Domain listed as managed in Vercel after transfer.

## Rollback

If web issue occurs before transfer completion:

1. Revert apex and `www` DNS records in Wix back to previous Wix values.
2. Wait propagation window.
3. Keep mail records untouched throughout rollback.
