import { ImageResponse } from "next/og";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const count = url.searchParams.get("count");

  return new ImageResponse(
    (
      <div tw="flex flex-col w-full h-full bg-slate-900 border-8 border-slate-800 p-6 justify-center items-center">
        <img
          src={`${process.env.NEXT_PUBLIC_URL}/degenlogo.png`}
          alt="Overlay"
          tw=" w-20 h-20"
        />
        <div tw="text-5xl font-extrabold text-[#A36EFD] mt-5">
          $DEGEN counter
        </div>
        <div tw="text-3xl font-extrabold text-white">current count</div>

        <div tw="text-6xl font-extrabold text-lime-500">{count}</div>
      </div>
    ),
    {
      width: 600,
      height: 400,
    }
  );
}
