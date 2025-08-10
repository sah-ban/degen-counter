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
    imageUrl: `${appUrl}/logo.png`,
    button: {
      title: "Increment the counter",
      action: {
        type: "launch_frame",
        name: "$DEGEN Counter",
        url: `${appUrl}`,
        splashImageUrl: `${appUrl}/logo.png`,
        splashBackgroundColor: "#FFFFFF",
      },
    },
  };

  return {
    title: "$DEGEN Counter",
    openGraph: {
      title: "$DEGEN Counter",
      description: "Increment the counter",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
