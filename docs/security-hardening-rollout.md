# Security hardening rollout

MFA and two-factor authentication are intentionally deferred.

## Before deploying

1. Apply `npx prisma migrate deploy` using the release environment. The additive migration adds `PasswordResetToken.userId`, supporting setup links for accounts without email. Deploy the schema before the application.
2. Configure private Cloudflare Images or a **private** `PAYMENT_PROOF_BUCKET` with public access blocked. New payment proofs fail closed in production when neither is configured. S3 bucket policies and IAM still require verification in the hosting account.
3. Set `TRUSTED_CLIENT_IP_HEADER` only to a header your ingress overwrites, with direct origin access blocked. Supported values are listed in `.env.example`. Unconfigured deployments group requests under a conservative shared `unknown` IP bucket; per-identifier and per-user limits always apply.
4. Rebuild the mobile client with the updated shared contract: account creation now returns `setupUrl` instead of plaintext `password`.

## Revoke previously public proof URLs

Run the migration on the original upload host with the release environment and private storage configured:

```sh
npm run security:privatize-payment-proofs
npm run security:privatize-payment-proofs -- --apply --actor=<operator-user-id>
```

The first command previews only. Both support `--org=<organization-id>`. Apply requires an existing operator user ID for the audit trail.
The apply command copies each linked payment proof into private storage, verifies the bytes, changes references, and deletes its old public Cloudflare image or local file. It preserves a retry marker until deletion succeeds. Re-run after resolving any reported failure. Orphaned assets or assets referenced by multiple payments are reported for manual investigation. Back up the database and preserve file backups under private access before running.

Existing public URLs remain exposed until their copies are revoked. If a CDN caches local uploads, invalidate `/uploads/payment-proof/*` after deletion. Previously downloaded files cannot be recalled.

## Account access

Creation handovers and PDFs contain one-hour, single-use password setup links. Only token hashes are stored. Setup and password reset atomically consume the link, revoke sessions and sibling links, and clear the initial password-change requirement. Existing email verification remains separate. Expired links can be replaced through Forgot password for accounts with email; administrators can reset/reissue access for accounts without email through the existing account management workflow.

No production schema, cloud configuration, or stored files are changed by editing this repository.
