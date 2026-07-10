export type InsightDomain =
  | "COLLECTIONS"
  | "RECONCILIATION"
  | "OCCUPANCY"
  | "MAINTENANCE"
  | "LEASES"
  | "WATER";

export type InsightSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type SmartInsightSnapshot = {
  collections: {
    expected: number;
    paid: number;
    deficit: number;
    defaulted: number;
    partial: number;
  };
  reconciliation: {
    unreconciled: number;
    disputed: number;
    awaitingVerification: number;
    staleVerification: number;
    unappliedPayments: number;
    missingReferences: number;
  };
  occupancy: {
    totalUnits: number;
    vacantUnits: number;
    staleVacancies: number;
    monthlyRentAtRisk: number;
  };
  maintenance: {
    openIssues: number;
    urgentIssues: number;
    staleIssues: number;
    unassignedIssues: number;
  };
  leases: {
    expiringIn30Days: number;
    expiringIn60Days: number;
  };
  water: {
    pendingReadings: number;
    rejectedReadings: number;
    unusualReadings: number;
  };
};

export type SmartRecommendation = {
  id: string;
  domain: InsightDomain;
  severity: InsightSeverity;
  priority: number;
  title: string;
  summary: string;
  evidence: string;
  actionLabel: string;
  href: string;
};

export type SmartInsights = {
  score: number;
  collectionRate: number;
  occupancyRate: number;
  attentionCount: number;
  recommendations: SmartRecommendation[];
  domainScores: Record<InsightDomain, number>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(Math.round(value), min), max);
}

function percentage(part: number, total: number, emptyValue = 100) {
  return total > 0 ? clamp((part / total) * 100) : emptyValue;
}

function addRecommendation(
  recommendations: SmartRecommendation[],
  recommendation: SmartRecommendation,
) {
  recommendations.push(recommendation);
}

export function buildSmartInsights(snapshot: SmartInsightSnapshot): SmartInsights {
  const collectionRate = percentage(
    snapshot.collections.paid,
    snapshot.collections.expected,
  );
  const occupancyRate = percentage(
    snapshot.occupancy.totalUnits - snapshot.occupancy.vacantUnits,
    snapshot.occupancy.totalUnits,
    0,
  );

  const domainScores: Record<InsightDomain, number> = {
    COLLECTIONS: clamp(
      collectionRate - snapshot.collections.defaulted * 4 - snapshot.collections.partial,
    ),
    RECONCILIATION: clamp(
      100 -
        snapshot.reconciliation.disputed * 12 -
        snapshot.reconciliation.staleVerification * 7 -
        snapshot.reconciliation.unreconciled * 2 -
        snapshot.reconciliation.unappliedPayments * 4,
    ),
    OCCUPANCY: clamp(occupancyRate - snapshot.occupancy.staleVacancies * 3),
    MAINTENANCE: clamp(
      100 -
        snapshot.maintenance.urgentIssues * 10 -
        snapshot.maintenance.staleIssues * 5 -
        snapshot.maintenance.unassignedIssues * 4,
    ),
    LEASES: clamp(
      100 -
        snapshot.leases.expiringIn30Days * 6 -
        Math.max(
          snapshot.leases.expiringIn60Days - snapshot.leases.expiringIn30Days,
          0,
        ) *
          2,
    ),
    WATER: clamp(
      100 -
        snapshot.water.rejectedReadings * 8 -
        snapshot.water.unusualReadings * 7 -
        snapshot.water.pendingReadings * 2,
    ),
  };

  const score = clamp(
    domainScores.COLLECTIONS * 0.28 +
      domainScores.RECONCILIATION * 0.2 +
      domainScores.OCCUPANCY * 0.18 +
      domainScores.MAINTENANCE * 0.16 +
      domainScores.LEASES * 0.1 +
      domainScores.WATER * 0.08,
  );
  const recommendations: SmartRecommendation[] = [];

  if (snapshot.reconciliation.disputed > 0) {
    addRecommendation(recommendations, {
      id: "resolve-payment-disputes",
      domain: "RECONCILIATION",
      severity: "CRITICAL",
      priority: 100 + snapshot.reconciliation.disputed,
      title: "Resolve disputed payments",
      summary: "Finance reports may be unreliable until these exceptions are cleared.",
      evidence: `${snapshot.reconciliation.disputed} disputed payment${snapshot.reconciliation.disputed === 1 ? "" : "s"}`,
      actionLabel: "Open reconciliation",
      href: "/dashboard/org/payments",
    });
  }

  if (snapshot.collections.defaulted > 0) {
    addRecommendation(recommendations, {
      id: "prioritize-overdue-collections",
      domain: "COLLECTIONS",
      severity: "HIGH",
      priority: 90 + snapshot.collections.defaulted,
      title: "Prioritize overdue collections",
      summary: "Start with the oldest and largest balances to improve this month's recovery.",
      evidence: `${snapshot.collections.defaulted} default-risk account${snapshot.collections.defaulted === 1 ? "" : "s"}`,
      actionLabel: "Review collection risks",
      href: "/dashboard/org/reports?payment=default",
    });
  }

  if (snapshot.maintenance.urgentIssues > 0 || snapshot.maintenance.staleIssues > 0) {
    const urgent = snapshot.maintenance.urgentIssues;
    const stale = snapshot.maintenance.staleIssues;
    addRecommendation(recommendations, {
      id: "clear-maintenance-pressure",
      domain: "MAINTENANCE",
      severity: urgent > 0 ? "HIGH" : "MEDIUM",
      priority: 80 + urgent * 2 + stale,
      title: "Clear maintenance pressure",
      summary: "Escalate urgent work and close tickets that have remained open for a week.",
      evidence: `${urgent} urgent, ${stale} open over 7 days`,
      actionLabel: "Open issues",
      href: "/dashboard/org/issues",
    });
  }

  if (snapshot.reconciliation.staleVerification > 0) {
    addRecommendation(recommendations, {
      id: "verify-stale-payments",
      domain: "RECONCILIATION",
      severity: "HIGH",
      priority: 78 + snapshot.reconciliation.staleVerification,
      title: "Verify stale payments",
      summary: "Payments waiting more than 48 hours can distort tenant balances.",
      evidence: `${snapshot.reconciliation.staleVerification} stale verification${snapshot.reconciliation.staleVerification === 1 ? "" : "s"}`,
      actionLabel: "Review payments",
      href: "/dashboard/org/payments",
    });
  }

  if (snapshot.occupancy.staleVacancies > 0) {
    addRecommendation(recommendations, {
      id: "market-stale-vacancies",
      domain: "OCCUPANCY",
      severity: "HIGH",
      priority: 75 + snapshot.occupancy.staleVacancies,
      title: "Act on long-running vacancies",
      summary: "Review pricing, listing quality, and inquiry follow-up for units vacant over 30 days.",
      evidence: `${snapshot.occupancy.staleVacancies} stale vacanc${snapshot.occupancy.staleVacancies === 1 ? "y" : "ies"}`,
      actionLabel: "Review vacant units",
      href: "/dashboard/org/units?status=VACANT",
    });
  }

  if (snapshot.leases.expiringIn30Days > 0) {
    addRecommendation(recommendations, {
      id: "prepare-lease-renewals",
      domain: "LEASES",
      severity: "MEDIUM",
      priority: 65 + snapshot.leases.expiringIn30Days,
      title: "Prepare lease renewals",
      summary: "Contact tenants early to reduce surprise move-outs and vacancy time.",
      evidence: `${snapshot.leases.expiringIn30Days} lease${snapshot.leases.expiringIn30Days === 1 ? "" : "s"} ending within 30 days`,
      actionLabel: "Review leases",
      href: "/dashboard/org/leases",
    });
  }

  if (snapshot.reconciliation.unappliedPayments > 0) {
    addRecommendation(recommendations, {
      id: "allocate-unapplied-payments",
      domain: "RECONCILIATION",
      severity: "MEDIUM",
      priority: 62 + snapshot.reconciliation.unappliedPayments,
      title: "Allocate unapplied money",
      summary: "Assign remaining payment amounts to the correct tenant obligations.",
      evidence: `${snapshot.reconciliation.unappliedPayments} payment${snapshot.reconciliation.unappliedPayments === 1 ? "" : "s"} with an unapplied balance`,
      actionLabel: "Open payments",
      href: "/dashboard/org/payments",
    });
  }

  if (snapshot.water.unusualReadings > 0 || snapshot.water.rejectedReadings > 0) {
    addRecommendation(recommendations, {
      id: "review-water-exceptions",
      domain: "WATER",
      severity: "MEDIUM",
      priority: 58 + snapshot.water.unusualReadings + snapshot.water.rejectedReadings,
      title: "Review water exceptions",
      summary: "Confirm unusual consumption and rejected readings before bills are finalized.",
      evidence: `${snapshot.water.unusualReadings} unusual, ${snapshot.water.rejectedReadings} rejected`,
      actionLabel: "Review water billing",
      href: "/dashboard/org/reports",
    });
  }

  if (snapshot.maintenance.unassignedIssues > 0) {
    addRecommendation(recommendations, {
      id: "assign-open-issues",
      domain: "MAINTENANCE",
      severity: "MEDIUM",
      priority: 55 + snapshot.maintenance.unassignedIssues,
      title: "Assign unowned maintenance work",
      summary: "Every open issue should have a clear owner and next action.",
      evidence: `${snapshot.maintenance.unassignedIssues} unassigned issue${snapshot.maintenance.unassignedIssues === 1 ? "" : "s"}`,
      actionLabel: "Assign issues",
      href: "/dashboard/org/issues",
    });
  }

  if (snapshot.reconciliation.missingReferences > 0) {
    addRecommendation(recommendations, {
      id: "complete-payment-references",
      domain: "RECONCILIATION",
      severity: "LOW",
      priority: 40 + snapshot.reconciliation.missingReferences,
      title: "Complete payment references",
      summary: "Add source references so future statement matching remains auditable.",
      evidence: `${snapshot.reconciliation.missingReferences} payment${snapshot.reconciliation.missingReferences === 1 ? "" : "s"} missing a source reference`,
      actionLabel: "Review payments",
      href: "/dashboard/org/payments",
    });
  }

  recommendations.sort((left, right) => right.priority - left.priority);

  return {
    score,
    collectionRate,
    occupancyRate,
    attentionCount: recommendations.filter((item) =>
      ["CRITICAL", "HIGH"].includes(item.severity),
    ).length,
    recommendations,
    domainScores,
  };
}
