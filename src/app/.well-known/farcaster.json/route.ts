export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
      payload: "eyJkb21haW4iOiJjb3VudGVyLml0c2Nhc2hsZXNzLmNvbSJ9",
      signature:
        "MHhlMTRkZmE2ZDIzMWRjNWU5YWNkNjRjZWE1NDRmZjVhMzUxMjMwOWQ4ZjFmZjJiOTNmNzk5YmU4MThiNDMxOWVhNDdmMTZiNjAzZDMwMzk4ODYzNTFkNjY2ZjhjNzBhNzIwYTYyMmRhNjIxYzFjYTU1MDc4ZGQ5MTk2MDRiZDgxZTFj",
    },
    frame: {
      version: "1",
      name: "Degen Counter",
      iconUrl: `${appUrl}/logo.png`,
      homeUrl: appUrl,
      buttonTitle: "Increment",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#333333",
      webhookUrl: `${appUrl}/api/webhook`,
      canonicalDomain: "counter.itscashless.com",
    },
    baseBuilder: {
      allowedAddresses: ["0x06e5B0fd556e8dF43BC45f8343945Fb12C6C3E90"],
    },
  };

  return Response.json(config);
}
