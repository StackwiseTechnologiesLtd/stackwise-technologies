import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { updateEngagementTracking } from "@/lib/contracts/actions";
import { parseMilestones } from "@/lib/contracts/milestones";
import { CONTRACT_DELIVERY_PHASES } from "@/lib/contracts/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    deliveryPhase?: string;
    progressHeadline?: string | null;
    progressDetail?: string | null;
    milestones?: unknown;
  };

  if (
    body.deliveryPhase &&
    !CONTRACT_DELIVERY_PHASES.includes(body.deliveryPhase as typeof CONTRACT_DELIVERY_PHASES[number])
  ) {
    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  }

  try {
    const engagement = await updateEngagementTracking(id, {
      deliveryPhase: body.deliveryPhase as typeof CONTRACT_DELIVERY_PHASES[number],
      progressHeadline: body.progressHeadline,
      progressDetail: body.progressDetail,
      milestones: body.milestones !== undefined
        ? parseMilestones(body.milestones)
        : undefined,
    });
    return NextResponse.json({ engagement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not found") ? 404 : 400 },
    );
  }
}
