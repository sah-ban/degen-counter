import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<
    { username: string; count: number }[]
  >([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboard(data.leaderboard);
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="relative flex flex-col h-full w-full max-w-md mx-auto text-center p-6 backdrop-blur rounded-xl shadow-2xl overflow-hidden z-10">
        <div className="flex-1 max-h-full overflow-y-auto scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-800">
          <ul className="text-gray-300 font-medium space-y-2">
            {leaderboard.map((user, index) => (
              <li
                key={index}
                className="flex justify-between items-center px-3 py-2 bg-white bg-opacity-10 rounded-lg"
              >
                <span className="text-lg text-white">
                  {index + 1}. {user.username}
                </span>
                <span className="text-lg font-bold text-purple-400">
                  {user.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
