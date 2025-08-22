# DEGEN COUNTER

This is a **Mini App** built for [**Farcaster**](https://farcaster.xyz), a decentralized social media protocol.

This mini app interacts with the smart contract deployed on Base Mainnet.

## Features

- Dislays the Total number of time a user(address) incremented the counter
- Displays Total number of time the counter was incremented
- Displays when the user last incremented the counter
- Get paid in $DEGEN to increment the counter
- Only admin can see the vault balance and deposit to the vault
- LeaderBoard displaying all the users who incremented the counter

![og](public/og.png)

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Wagmi](https://wagmi.sh/)
- [Viem](https://viem.sh/) 


## 📦 Getting Started

Follow these steps to set up the project locally:

### 1. Clone the Repository

```bash
git clone https://github.com/sah-ban/degen-counter
cd degen-counter
```

### 2. Install Dependencies

```bash
yarn
```

### 3. Configure Environment Variables

- Rename the example environment file:

```bash
mv example.env .env
```

- Generate a secure secret for `NEXTAUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- Replace the placeholder in `.env` with the generated value.

---

## 💻 Run the Development Server

```bash
yarn dev
```

The app will be available at `http://localhost:3000`.

---

## 🌐 Preview Locally with Ngrok

To test your app on Farcaster:

1. Start an ngrok tunnel:

```bash
ngrok http 3000
```

2. Copy the provided ngrok URL and open it in the [Farcaster Developer Tools](https://farcaster.xyz/~/developers/mini-apps/preview).

---

## 🧩 Customize the Mini App

Edit the main logic and UI in the following file:

```tsx
./src/components/Main.tsx
```

---

## 🚀 Deploying the App

### 1. Deploy to [Vercel](https://vercel.com/)

- Create a new project by importing your GitHub repository.
- During setup, add the following environment variable:

```
Key: NEXTAUTH_SECRET
Value: <your-generated-secret>
```

- Click **Deploy**.

### 2. Post-Deployment Steps

- Go to your Vercel **Dashboard** and copy the live deployment URL.
- Navigate to **Settings > Environment Variables**, and add the remaining variables from your `.env` file.
- Save and redeploy if needed.

---

## 🔗 Link Your Farcaster Account

### 1. Register Your Domain

- Go to [Farcaster Developer Tools](https://farcaster.xyz/~/developers/mini-apps).
- Paste your Vercel deployment domain.
- Untick **Include Example Definition**.
- Copy the generated **Domain Manifest** (automatically copied to clipboard).

### 2. Update the Domain Manifest in the Project

- Open the following file:

```tsx
./src/app/.well-known/farcaster.json/route.ts
```

- Replace the `accountAssociation` object with the one from the manifest.
- Commit and push your changes to deploy them.

---

## ✅ You're All Set!

Your Farcaster Mini App is now ready to go live 🚀

For questions, feel free to reach out or open an issue in the [GitHub repo](https://github.com/sah-ban/degen-counter/issues).
