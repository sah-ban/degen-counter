import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getUserNotificationDetails } from "~/lib/kv";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key || key !== process.env.KEY) {
    return NextResponse.json(
      { error: "Invalid or misssing key" },
      { status: 400 }
    );
  }
  try {
    const { title, body, targetUrl } = await request.json();

    if (!title || !body || !targetUrl) {
      console.error("Missing required fields:", { title, body, targetUrl });
      return NextResponse.json(
        { error: "Missing title, body, or targetUrl" },
        { status: 400 }
      );
    }

    // Use SCAN to fetch keys incrementally
    const tokenKeys: string[] = [];
    let cursor = "0";
    do {
      const scanResult = await redis.scan(cursor, {
        match: "counter:user:*",
        count: 100, // Adjust count based on your needs
      });
      cursor = scanResult[0]; // Update cursor for next iteration
      tokenKeys.push(...scanResult[1]); // Add found keys to tokenKeys
    } while (cursor !== "0");

    if (!tokenKeys.length) {
      console.error("No notification tokens found in Redis");
      return NextResponse.json(
        { error: "No users found with notification tokens" },
        { status: 404 }
      );
    }

    const tokensData = await Promise.all(
      tokenKeys.map(async (key) => {
        const fid = key.split(":").pop();
        if (!fid) {
          console.warn(`Invalid key format: ${key}`);
          return null;
        }
        const data = await getUserNotificationDetails(Number(fid));
        if (!data) {
          console.warn(`No data for FID: ${fid}`);
          return null;
        }
        return { fid, token: data.token, url: data.url };
      })
    );

    const validTokens = tokensData.filter(
      (data): data is { fid: string; token: string; url: string } => !!data
    );

    if (!validTokens.length) {
      console.error("No valid tokens found after filtering");
      return NextResponse.json(
        { error: "No valid tokens found" },
        { status: 404 }
      );
    }

    const batchSize = 100;
    const notificationIdBase = `broadcast-${new Date().toISOString()}`;
    const results: {
      successfulTokens: string[];
      invalidTokens: string[];
      rateLimitedTokens: string[];
    }[] = [];

    for (let i = 0; i < validTokens.length; i += batchSize) {
      const batch = validTokens.slice(i, i + batchSize);
      const tokens = batch.map((t) => t.token);
      const fids = batch.map((t) => t.fid);
      const notificationId = `${notificationIdBase}-${fids[0] || "batch"}`;
      const notificationUrl = batch[0].url;

      const payload = {
        notificationId,
        title: title.slice(0, 32),
        body: body.slice(0, 128),
        targetUrl: targetUrl.slice(0, 1024),
        tokens,
      };

      const response = await fetch(notificationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.text();

      if (!response.ok) {
        console.error(
          `Failed to send batch ${i / batchSize + 1}: ${response.status} ${
            response.statusText
          }`,
          responseBody
        );
        continue;
      }

      let result: {
        successfulTokens: string[];
        invalidTokens: string[];
        rateLimitedTokens: string[];
      };
      try {
        const parsed = JSON.parse(responseBody);
        result = parsed.result || parsed;
        results.push(result);
      } catch (parseError) {
        console.error(
          `Failed to parse response for batch ${i / batchSize + 1}:`,
          parseError,
          responseBody
        );
        continue;
      }

      if (result.invalidTokens?.length) {
        await Promise.all(
          result.invalidTokens.map(async (token: string) => {
            const invalidEntry = validTokens.find((t) => t.token === token);
            if (invalidEntry) {
              await redis.del(`counter:user:${invalidEntry.fid}`);
              console.log(`Deleted invalid token for FID: ${invalidEntry.fid}`);
            }
          })
        );
      }

      if (i + batchSize < validTokens.length) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    }

    const allSuccessful = results.flatMap((r) => r.successfulTokens || []);
    const allRateLimited = results.flatMap((r) => r.rateLimitedTokens || []);

    console.log(
      `Notification sending complete. Successful: ${allSuccessful.length}, Rate-limited: ${allRateLimited.length}`
    );

    return NextResponse.json({
      message: `Sent notifications to ${allSuccessful.length} users`,
      rateLimitedTokens: allRateLimited,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
