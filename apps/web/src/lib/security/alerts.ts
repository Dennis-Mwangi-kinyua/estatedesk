import "server-only";

type SecurityAlertSeverity = "info" | "warning" | "critical";

type SecurityAlertInput = {
  event: string;
  severity?: SecurityAlertSeverity;
  actorUserId?: string | null;
  orgId?: string | null;
  entityType?: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

function getAlertWebhookUrl() {
  return process.env.SECURITY_ALERT_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL;
}

export async function sendSecurityAlert(input: SecurityAlertInput) {
  const payload = {
    app: "EstateDesk",
    severity: input.severity ?? "warning",
    event: input.event,
    actorUserId: input.actorUserId ?? undefined,
    orgId: input.orgId ?? undefined,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  };

  const webhookUrl = getAlertWebhookUrl();

  if (!webhookUrl) {
    console.warn("security-alert", payload);
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Security alert webhook failed:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Security alert webhook error:", error);
  }
}
