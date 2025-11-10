import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // TODO: Integrate with your newsletter service (Mailchimp, SendGrid, etc.)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Newsletter subscription error:", error);
    }
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
