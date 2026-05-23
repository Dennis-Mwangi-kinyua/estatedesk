
#!/usr/bin/env bash
set -euo pipefail

declare -a ROUTES=(
  "users:User"
  "platform-permissions:PlatformPermission"
  "organizations:Organization"
  "organization-settings:OrganizationSettings"
  "subscriptions:Subscription"
  "subscription-plan-changes:SubscriptionPlanChange"
  "assets:Asset"
  "memberships:Membership"
  "properties:Property"
  "buildings:Building"
  "units:Unit"
  "tenants:Tenant"
  "next-of-kin:NextOfKin"
  "leases:Lease"
  "caretaker-assignments:CaretakerAssignment"
  "rent-charges:RentCharge"
  "meter-readings:MeterReading"
  "water-bills:WaterBill"
  "tax-charges:TaxCharge"
  "payments:Payment"
  "receipts:Receipt"
  "notifications:Notification"
  "move-out-notices:MoveOutNotice"
  "inspections:Inspection"
  "issue-tickets:IssueTicket"
  "audit-logs:AuditLog"
  "invitations:Invitation"
  "api-keys:ApiKey"
)

to_delegate() {
  local model="$1"
  local first rest
  first="$(printf '%s' "$model" | cut -c1 | tr '[:upper:]' '[:lower:]')"
  rest="$(printf '%s' "$model" | cut -c2-)"
  printf '%s%s' "$first" "$rest"
}

for entry in "${ROUTES[@]}"; do
  route="${entry%%:*}"
  model="${entry##*:}"
  delegate="$(to_delegate "$model")"

  mkdir -p "src/app/api/${route}/[id]"

  cat > "src/app/api/${route}/route.ts" <<EOF
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.${delegate}.findMany();
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("GET /api/${route} error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ${model} records" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const item = await prisma.${delegate}.create({
      data: body,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/${route} error:", error);
    return NextResponse.json(
      { error: "Failed to create ${model}" },
      { status: 500 }
    );
  }
}
EOF

  cat > "src/app/api/${route}/[id]/route.ts" <<EOF
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const item = await prisma.${delegate}.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "${model} not found" }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error("GET /api/${route}/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ${model}" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const body = await req.json();

    const item = await prisma.${delegate}.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error("PUT /api/${route}/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update ${model}" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    await prisma.${delegate}.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/${route}/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete ${model}" },
      { status: 500 }
    );
  }
}
EOF
done

echo "REST route scaffold created."
