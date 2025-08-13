"use client";

import { useEffect, useState } from "react";
import sdk, { type Context } from "@farcaster/frame-sdk";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useReadContract,
  useWriteContract,
  useConnect,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { counterAbi } from "../contracts/abi";
import { config } from "~/components/providers/WagmiProvider";

export default function Main() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);

      sdk.actions.ready({});
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const COUNTER_CONTRACT_ADDRESS = "0xD0CB93FBB62B176D0Cf0bD739390c8a8A8C16A8D";
  const TOKEN_ADDRESS = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";

  const { address, isConnected } = useAccount();
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [newTokenAmount, setNewTokenAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const formatTimeElapsed = (timestamp: string | number | undefined) => {
    if (!timestamp || timestamp === "never") return "Never";
    const numTimestamp = parseInt(timestamp.toString(), 10);
    if (isNaN(numTimestamp) || numTimestamp <= 0) return "Never";
    const now = Math.floor(Date.now() / 1000);
    const secondsElapsed = now - numTimestamp;
    if (secondsElapsed <= 0) return "Just now";
    if (secondsElapsed < 60) {
      return `${secondsElapsed} second${secondsElapsed !== 1 ? "s" : ""} ago`;
    }
    const minutes = Math.floor(secondsElapsed / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  const { data: totalCount } = useReadContract({
    address: COUNTER_CONTRACT_ADDRESS,
    abi: counterAbi,
    functionName: "getTotalCount",
    query: { enabled: true },
  }) as { data: bigint | undefined };

  const { data: userCount } = useReadContract({
    address: COUNTER_CONTRACT_ADDRESS,
    abi: counterAbi,
    functionName: "getUserCount",
    args: [address],
    query: { enabled: !!address },
  }) as { data: bigint | undefined };

  const { data: lastIncrement } = useReadContract({
    address: COUNTER_CONTRACT_ADDRESS,
    abi: counterAbi,
    functionName: "getLastIncrementTimestamp",
    args: [address],
    query: { enabled: !!address },
  }) as { data: string | undefined };

  const { data: contractBalance } = useReadContract({
    address: COUNTER_CONTRACT_ADDRESS,
    abi: counterAbi,
    functionName: "getContractTokenBalance",
    query: { enabled: true },
  }) as { data: bigint | undefined };

  const { data: owner } = useReadContract({
    address: COUNTER_CONTRACT_ADDRESS,
    abi: counterAbi,
    functionName: "owner",
    query: { enabled: true },
  }) as { data: string | undefined };

  const { data: tokenAmount } = useReadContract({
    address: COUNTER_CONTRACT_ADDRESS,
    abi: counterAbi,
    functionName: "tokenAmount",
    query: { enabled: true },
  }) as { data: bigint | undefined };

  const handleIncrement = async () => {
    try {
      await writeContract({
        address: COUNTER_CONTRACT_ADDRESS,
        abi: counterAbi,
        functionName: "incrementCounter",
      });
    } catch (error) {
      console.error("Increment failed:", error);
    }
  };

  const handleUpdateTokenAmount = async () => {
    if (!newTokenAmount) return;
    try {
      await writeContract({
        address: COUNTER_CONTRACT_ADDRESS,
        abi: counterAbi,
        functionName: "updateTokenAmount",
        args: [parseEther(newTokenAmount)],
      });
      setNewTokenAmount("");
    } catch (error) {
      console.error("Update token amount failed:", error);
    }
  };

  const handleDepositTokens = async () => {
    if (!depositAmount) return;
    try {
      await writeContract({
        address: TOKEN_ADDRESS,
        abi: counterAbi,
        functionName: "approve",
        args: [COUNTER_CONTRACT_ADDRESS, parseEther(depositAmount)],
      });

      await new Promise((resolve) => setTimeout(resolve, 5000)); // Replace with proper transaction receipt check

      await writeContract({
        address: COUNTER_CONTRACT_ADDRESS,
        abi: counterAbi,
        functionName: "depositTokens",
        args: [parseEther(depositAmount)],
      });
      setDepositAmount("");
    } catch (error) {
      console.error("Deposit tokens failed:", error);
    }
  };

  const isOwner =
    address && owner && address.toLowerCase() === owner?.toLowerCase();

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>Counter DApp</h1>

      {!isConnected ? (
        <Connect />
      ) : (
        <>
          <h3>DEGEN COUNTER</h3>
          <p>
            Total Count:{" "}
            {totalCount !== undefined ? totalCount.toString() : "Loading..."}
          </p>
          <p>
            Your Count:{" "}
            {userCount !== undefined ? userCount.toString() : "Loading..."}
          </p>
          <p>Last Increment: {formatTimeElapsed(lastIncrement)}</p>
          <p>
            Contract Token Balance:{" "}
            {contractBalance !== undefined
              ? formatEther(contractBalance)
              : "Loading..."}{" "}
            Tokens
          </p>
          <p>
            Current Token Reward:{" "}
            {tokenAmount !== undefined
              ? formatEther(tokenAmount)
              : "Loading..."}{" "}
            Tokens
          </p>

          <button
            onClick={handleIncrement}
            disabled={isPending || isConfirming}
          >
            {isPending
              ? "Pending..."
              : isConfirming
              ? "Confirming..."
              : "Increment Counter"}
          </button>
          {writeError && (
            <p style={{ color: "red" }}>Error: {writeError.message}</p>
          )}
          {isConfirmed && (
            <p style={{ color: "green" }}>Transaction confirmed!</p>
          )}

          {isOwner && (
            <div style={{ marginTop: "20px" }}>
              <h3>Owner Controls</h3>
              <div>
                <input
                  type="number"
                  placeholder="New token amount (in tokens)"
                  value={newTokenAmount}
                  onChange={(e) => setNewTokenAmount(e.target.value)}
                />
                <button
                  onClick={handleUpdateTokenAmount}
                  disabled={isPending || isConfirming}
                >
                  Update Token Amount
                </button>
              </div>
              <div style={{ marginTop: "10px" }}>
                <input
                  type="number"
                  placeholder="Deposit amount (in tokens)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <button
                  onClick={handleDepositTokens}
                  disabled={isPending || isConfirming}
                >
                  Deposit Tokens
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Connect() {
  const { connect } = useConnect();
  const [isClicked, setIsClicked] = useState(false);

  const handleConnect = () => {
    setIsClicked(true);
    setTimeout(() => {
      connect({ connector: config.connectors[0] });
    }, 500);

    setTimeout(() => setIsClicked(false), 500);
  };

  return (
    <div className="flex flex-col mt-2">
      <button
        onClick={handleConnect}
        className="text-white text-center py-2 rounded-xl font-semibold text-lg shadow-lg relative overflow-hidden transform transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center gap-2"
        style={{
          background:
            "linear-gradient(90deg, #8B5CF6, #7C3AED, #A78BFA, #8B5CF6)",
          backgroundSize: "300% 100%",
          animation: "gradientAnimation 3s infinite ease-in-out",
        }}
      >
        <div
          className={`absolute inset-0 bg-[#38BDF8] transition-all duration-500 ${
            isClicked ? "scale-x-100" : "scale-x-0"
          }`}
          style={{ transformOrigin: "center" }}
        ></div>
        <style>{`
              @keyframes gradientAnimation {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
        <div className="flex flex-row gap-2 px-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 relative z-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
            />
          </svg>{" "}
          <span className="relative z-10"> {`Connect Wallet`}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 relative z-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
            />
          </svg>{" "}
        </div>
      </button>
    </div>
  );
}
