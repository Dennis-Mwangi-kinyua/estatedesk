# @estatedesk/notifications

In-app, push, email, SMS, and WhatsApp notification delivery.

## Phase 1

Runs **in-process** inside `@estatedesk/web`. Cron delivery still routes through the web app API.

## Phase 2+

Move cron consumers into `apps/workers` and deploy notifications as its own process.
