import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");
  console.log(`Requested fid: ${fid}`);

  if (!fid) {
    console.log("Error: fid parameter is missing");
    return NextResponse.json(
      { error: "fid parameter is required" },
      { status: 400 }
    );
  }
  const hubUrl = process.env.HUB_URL;
  const followUrl = `${hubUrl}/v1/linksByFid?fid=${fid}`;

  const devFid = 268438;

  try {
    const response = await axios.get(followUrl);
    const messages = response.data?.messages ?? [];

    for (const message of messages) {
      if (message?.data?.linkBody?.targetFid === devFid) {
        return NextResponse.json({ isFollowing: true });
      }
    }

    return NextResponse.json({ isFollowing: false });
  } catch (error) {
    console.error("Failed to fetch follow data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
