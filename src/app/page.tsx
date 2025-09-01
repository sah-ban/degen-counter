import { Metadata } from "next";
import App from "~/app/app";

const appUrl = process.env.NEXT_PUBLIC_URL;

export const revalidate = 300;

interface Props {
  searchParams: Promise<{
    count: string;
  }>;
}

export async function generateMetadata({}: Props): Promise<Metadata> {
  const frame = {
    version: "next",
    imageUrl: `${appUrl}/og.png`,
    button: {
      title: "Increment the counter",
      action: {
        type: "launch_frame",
        name: "$DEGEN Counter",
        url: `${appUrl}`,
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: "#333333",
      },
    },
  };

  return {
    title: "$DEGEN Counter",
    openGraph: {
      title: "$DEGEN Counter",
      description: "Increment the counter",
      images: [
        {
          url: `${appUrl}/og.png`,
          width: 1200,
          height: 630,
          alt: "$DEGEN Counter",
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
