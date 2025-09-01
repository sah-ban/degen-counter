import { NextRequest, NextResponse } from "next/server";
import FarmaSDK from "../farma-sdk.js";

const appUrl = process.env.NEXT_PUBLIC_URL;

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key || key !== process.env.KEY) {
    return NextResponse.json(
      { error: "Invalid or misssing key" },
      { status: 400 }
    );
  }

  try {
    const farma = new FarmaSDK({
      hostname: "farma.pingem.xyz",
      port: 443,
      frameId: process.env.FARMA_FRAME_ID,
      privateKey: process.env.FARMA_PRIVATE_KEY,
    });

    await farma.sendNotification(
      `${process.env.FARMA_FRAME_ID}`,
      `DEGEN is now DEGEN Counter`,
      `Increment the counter every 6 hours to claim few $DEGEN!`,
      `${appUrl}`
    );

    return NextResponse.json({
      success: true,
      message: "Notification sent",
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
