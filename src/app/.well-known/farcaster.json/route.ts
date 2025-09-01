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
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#333333",
    },
    baseBuilder: {
      allowedAddresses: ["0x06e5B0fd556e8dF43BC45f8343945Fb12C6C3E90"],
    },
  };

  return Response.json(config);
}
