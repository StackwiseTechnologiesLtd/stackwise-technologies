import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createAndGenerateContract } from "@/lib/contracts/actions";
import {
  CONTRACT_DOCUMENT_KINDS,
  type ContractDocumentKind,
} from "@/lib/contracts/types";
import { listContractEngagements } from "@/lib/db/contracts";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const engagements = await listContractEngagements();
  return NextResponse.json({ engagements });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    customerName?: string;
    customerEmail?: string;
    companyName?: string;
    documentKind?: string;
    servicesBrief?: string;
    commercialNotes?: string;
    leadId?: string;
  };

  const customerName = body.customerName?.trim();
  const customerEmail = body.customerEmail?.trim();
  const servicesBrief = body.servicesBrief?.trim();
  const documentKind = body.documentKind as ContractDocumentKind;

  if (!customerName || !customerEmail || !servicesBrief) {
    return NextResponse.json(
      { error: "customerName, customerEmail, and servicesBrief are required" },
      { status: 400 },
    );
  }

  if (!CONTRACT_DOCUMENT_KINDS.includes(documentKind)) {
    return NextResponse.json({ error: "Invalid document kind" }, { status: 400 });
  }

  try {
    const engagement = await createAndGenerateContract({
      customerName,
      customerEmail,
      companyName: body.companyName?.trim(),
      documentKind,
      servicesBrief,
      commercialNotes: body.commercialNotes?.trim(),
      leadId: body.leadId?.trim() || null,
    });
    return NextResponse.json({ engagement });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create contract" },
      { status: 500 },
    );
  }
}
