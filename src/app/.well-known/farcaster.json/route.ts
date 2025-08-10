export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    frame: {
      version: "1",
      name: "Degen Counter",
      iconUrl: `${appUrl}/logo.png`,
      homeUrl: appUrl,
      buttonTitle: "Increment",
      splashImageUrl: `${appUrl}/logo.png`,
      splashBackgroundColor: "#FFFFFF",
    },
  };

  return Response.json(config);
}
