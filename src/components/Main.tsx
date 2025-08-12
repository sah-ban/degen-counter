"use client";

import { useEffect, useState } from "react";
import sdk, { type Context } from "@farcaster/frame-sdk";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { counterAbi } from "../contracts/abi";

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
        <p>Please connect your wallet</p>
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
          <p>Last Increment: {lastIncrement ?? "Loading..."}</p>
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
