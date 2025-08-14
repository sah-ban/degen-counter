import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL ?? "");

export async function GET() {
  const topUsers = await redis.zrevrange("leaderboard", 0, -1, "WITHSCORES");

  const leaderboard = [];
  for (let i = 0; i < topUsers.length; i += 2) {
    leaderboard.push({ username: topUsers[i], count: Number(topUsers[i + 1]) });
  }

  return NextResponse.json({ leaderboard });
}
