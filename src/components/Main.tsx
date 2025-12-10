"use client";

import { useEffect, useState } from "react";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useReadContract,
  useWriteContract,
  useConnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { parseEther, Hash } from "viem";
import { counterAbi } from "../contracts/abi";
import { config } from "~/components/providers/WagmiProvider";
import { base } from "wagmi/chains";
import { formatUnits } from "viem";
import { blocked } from "./blocked";

export default function Main() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();

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

  const COUNTER_CONTRACT_ADDRESS = "0xd4DF7206dC74F2CD71DcF26394a32184197A140F";
  const TOKEN_ADDRESS = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { address, isConnected } = useAccount();
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [depositAmount, setDepositAmount] = useState("");
  const [approveHash, setApproveHash] = useState<Hash | undefined>(undefined);
  const { isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const [isClicked, setIsClicked] = useState(false);

  const formatTimeElapsed = (timestamp: string | number | undefined) => {
    if (!timestamp || timestamp === "never") return "Never";
    const numTimestamp = parseInt(timestamp.toString(), 10);
    if (isNaN(numTimestamp) || numTimestamp <= 0) return "Never";
    const now = Math.floor(Date.now() / 1000);
    const secondsElapsed = now - numTimestamp;
    if (secondsElapsed <= 0) return "Just now";

    const days = Math.floor(secondsElapsed / (24 * 60 * 60));
    const hours = Math.floor((secondsElapsed % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((secondsElapsed % (60 * 60)) / 60);
    const seconds = secondsElapsed % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && parts.length === 0)
      parts.push(`${seconds} sec${seconds !== 1 ? "s" : ""}`);

    return parts.length > 0 ? parts.join(" ") + " ago" : "Just now";
  };

  const { data: totalCount, refetch: refetchTotalCount } = useReadContract({
    address: COUNTER_CONTRACT_ADDRESS,
    abi: counterAbi,
    functionName: "getTotalCount",
    query: { enabled: true },
  }) as { data: bigint | undefined; refetch: () => void };

  const { data: userCount, refetch: refetchUserCount } = useReadContract({
    address: COUNTER_CONTRACT_ADDRESS,
    abi: counterAbi,
    functionName: "getUserCount",
    args: [address],
    query: { enabled: !!address },
  }) as { data: bigint | undefined; refetch: () => void };

  const { data: lastIncrement, refetch: refetchLastIncrement } =
    useReadContract({
      address: COUNTER_CONTRACT_ADDRESS,
      abi: counterAbi,
      functionName: "getLastIncrementTimestamp",
      args: [address],
      query: { enabled: !!address },
    }) as { data: string | undefined; refetch: () => void };

  const { data: rawContractBalance, refetch: refetchContractBalance } =
    useReadContract({
      address: COUNTER_CONTRACT_ADDRESS,
      abi: counterAbi,
      functionName: "getContractTokenBalance",
      query: { enabled: true },
    }) as { data: bigint | undefined; refetch: () => void };

  const contractBalance = rawContractBalance
    ? formatUnits(rawContractBalance, 18)
    : "0.00";

  const { data: rawTokenAmount } = useReadContract({
    address: COUNTER_CONTRACT_ADDRESS,
    abi: counterAbi,
    functionName: "tokenAmount",
    query: { enabled: true },
  }) as { data: bigint | undefined };

  const tokenAmount = rawTokenAmount ? formatUnits(rawTokenAmount, 18) : "0.00";

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

  const handleDepositTokens = async () => {
    if (!depositAmount) return;
    try {
      // Step 1: Approve tokens
      await writeContract(
        {
          address: TOKEN_ADDRESS,
          abi: [
            {
              inputs: [
                { internalType: "address", name: "spender", type: "address" },
                { internalType: "uint256", name: "amount", type: "uint256" },
              ],
              name: "approve",
              outputs: [{ internalType: "bool", name: "", type: "bool" }],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          functionName: "approve",
          args: [COUNTER_CONTRACT_ADDRESS, parseEther(depositAmount)],
        },
        {
          onSuccess: (hash: Hash) => {
            setApproveHash(hash);
          },
        }
      );
    } catch (error) {
      console.error("Approve tokens failed:", error);
    }
  };

  useEffect(() => {
    if (isApproved && depositAmount) {
      const deposit = async () => {
        try {
          await writeContract({
            address: COUNTER_CONTRACT_ADDRESS,
            abi: counterAbi,
            functionName: "depositTokens",
            args: [parseEther(depositAmount)],
          });
          setDepositAmount("");
          setApproveHash(undefined);
          refetchContractBalance();
        } catch (error) {
          console.error("Deposit tokens failed:", error);
        }
      };
      deposit();
    }
  }, [isApproved, depositAmount, writeContract, refetchContractBalance]);

  useEffect(() => {
    if (isConfirmed) {
      sdk.haptics.notificationOccurred("success");
      refetchTotalCount();
      refetchUserCount();
      refetchLastIncrement();
    }
  }, [
    isConfirmed,
    refetchTotalCount,
    refetchUserCount,
    refetchLastIncrement,
    context,
  ]);

  useEffect(() => {
    if (!context?.client.added && isConfirmed) {
      sdk.actions.addMiniApp();
    }
  }, [context?.client.added, isConfirmed]);

  const cast = async (): Promise<string | undefined> => {
    try {
      const result = await sdk.actions.composeCast({
        text: `Just incremented the DEGEN counter to ${totalCount}!`,
        embeds: [`${process.env.NEXT_PUBLIC_URL}?count=${totalCount}`],
      });
      return result.cast?.hash;
    } catch (error) {
      console.error("Error composing cast:", error);
      return undefined;
    }
  };
  const inc = () => {
    setIsClicked(true);
    setTimeout(() => {
      if (isConfirmed) {
        cast();
      } else {
        handleIncrement();
      }
    }, 500);

    setTimeout(() => setIsClicked(false), 500);
  };

  if (context?.client.clientFid !== 9152) return <Blocked />;

  if (blocked.includes(context?.user.fid || 0)) {
    return (
      <div className="min-h-screen w-full bg-yellow-50 flex flex-col items-center justify-center text-yellow-800 text-center px-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>

        <h2 className="text-xl font-semibold mb-2">
          Sorry for the inconvenience
        </h2>
        <p className="text-base">
          This miniapp is currently undergoing maintenance.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0f1a] via-[#1a0b2e] to-[#0f172a] overflow-hidden">
      {!isConnected ? (
        <Connect />
      ) : chainId !== base.id ? (
        <Switch />
      ) : (
        <div className="relative z-10 w-full max-w-md mx-4 flex flex-col h-screen">
          {/* Header */}
          <header className="text-center pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-[#A36EFD] via-[#22D3EE] to-[#A36EFD] bg-clip-text text-transparent animate-gradient bg-[length:300%_300%]">
              $DEGEN COUNTER
            </h1>
            <p className="text-gray-400 text-sm mt-2 tracking-widest uppercase">
              Live on Base
            </p>
          </header>

          {/* Stats Cards */}
          <div className="flex justify-center gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl transform hover:scale-105 transition-all duration-300">
              <p className="text-gray-300 text-xs uppercase tracking-wider text-center">
                You incremented
              </p>
              <p className="text-2xl font-bold text-white mt-1 text-center">
                {userCount ?? "0"}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl transform hover:scale-105 transition-all duration-300">
              <p className="text-gray-300 text-xs uppercase tracking-wider text-center">
                Last Increment
              </p>
              <p className="text-2xl font-bold text-white mt-1  text-center">
                {formatTimeElapsed(lastIncrement) ?? "—"}
              </p>
            </div>
          </div>

          {/* Total Count */}
          <div className="text-center my-10">
            <p className="text-gray-400 uppercase tracking-widest text-sm">
              Total Incremented
            </p>
            <div className="text-8xl font-black bg-gradient-to-br from-lime-400 to-green-600 bg-clip-text text-transparent drop-shadow-2xl">
              {totalCount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") ??
                "0"}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={inc}
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
                <span className="relative z-10">
                  {" "}
                  {isPending
                    ? "Processing..."
                    : isConfirming
                    ? "Incrementing..."
                    : isConfirmed
                    ? "Incremented!, Cast it!"
                    : "Increment"}
                </span>
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

          {/* Success Message */}
          {isConfirmed && (
            <div className="text-center mt-8 animate-bounce">
              <p className="text-lime-400 font-bold text-lg">
                Come back in 6 hours to increment again!
              </p>
            </div>
          )}
          {writeError && (
            <p className="relative text-red-400 text-center text-xs font-medium z-10 hidden">
              Error: {writeError.message}
            </p>
          )}
        </div>
      )}

      {/* Global Gradient Animation */}
      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>

      <footer className="flex-none fixed bottom-0 left-0 w-full p-4 text-center text-white z-50">
        {context?.user.fid === 268438 && (
          <div className="relative text-center backdrop-blur rounded-xl shadow-2xl p-3 w-full max-w-md border border-gray-700 z-10">
            <div className="text-gray-300 font-medium flex flex-row space-x-2 justify-center">
              <div>
                <span className="font-bold text-purple-400">Balance:</span>{" "}
                {contractBalance !== undefined ? contractBalance : "Loading..."}
              </div>
              <div>
                <span className="font-bold text-purple-400">Amount:</span>{" "}
                {tokenAmount !== undefined ? tokenAmount : "Loading..."}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-1/2 px-3 py-2 bg-gray-400 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                <button
                  onClick={handleDepositTokens}
                  disabled={isPending || isConfirming}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-700 via-purple-600 to-fuchsia-600 text-white font-medium shadow-lg ring-2 ring-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deposit
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() =>
            sdk.actions.openMiniApp({
              url: "https://2048.itscashless.com",
            })
          }
          className="bg-[#7C3AED] text-white px-4 py-2 rounded-lg hover:bg-[#38BDF8] transition cursor-pointer font-semibold mt-4 w-2/3"
        >
       claim $ARB
        </button>
      </footer>
    </div>
  );

  function Connect() {
    const { connect } = useConnect();
    const [isClicked, setIsClicked] = useState(false);

    const handleConnect = () => {
      setIsClicked(true);
      setTimeout(() => {
        if (chainId !== base.id) {
          switchChain({ chainId: base.id });
        } else {
          connect({ connector: config.connectors[0] });
        }
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
            <span className="relative z-10">
              {chainId !== base.id ? "Switch to Base" : "Connect Wallet"}
            </span>
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

  function Blocked() {
    return (
      <div className="min-h-screen w-full bg-yellow-50 flex flex-col items-center justify-center text-yellow-800 text-center px-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>

        <h2 className="text-xl font-semibold mb-2">
          Sorry for the inconvenience
        </h2>
        <p className="text-base">
          This miniapp is designed for Farcaster client only.
        </p>
      </div>
    );
  }
  function Switch() {
    const [isClicked, setIsClicked] = useState(false);

    const handleConnect = () => {
      setIsClicked(true);
      setTimeout(() => {
        switchChain({ chainId: base.id });
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
            <span className="relative z-10">Switch to Base</span>
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
}
