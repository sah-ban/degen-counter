import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { blocked } from "../../../components/blocked";

const quickAuth = createClient();

const baseChain = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://mainnet.base.org"] },
  },
});

const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as `0x${string}`;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as `0x${string}`;

export async function POST(req: NextRequest) {
  // Validate environment configuration
  if (!PRIVATE_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: SIGNER_PRIVATE_KEY missing" },
      { status: 500 }
    );
  }
  if (!CONTRACT_ADDRESS) {
    return NextResponse.json(
      { error: "Server misconfigured: CONTRACT_ADDRESS missing" },
      { status: 500 }
    );
  }

  // Validate Authorization Header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }
  const token = authHeader.split(" ")[1];

  // Verify Quick Auth JWT and extract FID
  let fid: number;
  try {
    let domain = "localhost";
    if (process.env.NEXT_PUBLIC_URL) {
      try {
        domain = new URL(process.env.NEXT_PUBLIC_URL).hostname;
      } catch {
        domain = process.env.NEXT_PUBLIC_URL.replace(/^https?:\/\//, "").split(
          "/"
        )[0];
      }
    }

    const result = await quickAuth.verifyJwt({ token, domain });
    fid = result.sub;
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }

  // Check blocked list
  if (blocked.includes(fid)) {
    return NextResponse.json({ error: "User is blocked" }, { status: 403 });
  }

  // Parse request body
  const body = await req.json();
  const { address, nonce } = body;

  if (!address || nonce === undefined) {
    return NextResponse.json(
      { error: "Missing address or nonce in body" },
      { status: 400 }
    );
  }

  // Generate EIP-712 signature
  const account = privateKeyToAccount(PRIVATE_KEY);

  const domain = {
    name: "DegenCounter",
    version: "1",
    chainId: baseChain.id,
    verifyingContract: CONTRACT_ADDRESS,
  } as const;

  const types = {
    Increment: [
      { name: "user", type: "address" },
      { name: "fid", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  } as const;

  try {
    const message = {
      user: address,
      fid: BigInt(fid),
      nonce: BigInt(nonce),
    };

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: "Increment",
      message,
    });

    return NextResponse.json({
      signature,
      fid,
      nonce,
      signer: account.address,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to sign message" },
      { status: 500 }
    );
  }
}
