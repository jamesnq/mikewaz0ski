# Digital Marketplace Bot

A multi-platform digital goods marketplace bot that supports Discord, Telegram, and Facebook platforms. Built with Remix, Vite, and shadcn/ui for a modern and responsive experience.

## Features

- 🤖 Multi-platform support (Discord, Telegram, Facebook)
- 💰 Digital wallet system with transaction history
- 🛍️ Digital goods marketplace
- 🎮 Support for various digital products:
  - Brawl Coins
  - YouTube Premium
  - Spotify
  - Discord Nitro
- 💳 Wallet-to-wallet transfers
- 📊 Order management system
- 🎨 Built-in theme switcher (Light/Dark mode)

## Tech Stack

- **Frontend**: Remix + Vite + shadcn/ui
- **Backend**: Node.js + Express
- **Database**: MongoDB with Prisma ORM
- **Bot Frameworks**: 
  - Discord.js
  - Telegraf
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript
- **Code Quality**: Biome

## Prerequisites

- Node.js >= 18.0.0
- MongoDB database
- Platform API keys (Discord, Telegram, Facebook)

## Environment Setup

1. Create a `.env` file in the root directory
2. Add the following environment variables:
```env
MONGO_URI=your_mongodb_connection_string
# Add other platform-specific API keys
```

## Development

1. Install dependencies:
```sh
npm install
```

2. Generate Prisma client and push database schema:
```sh
npm run prisma-build
```

3. Start the development server:
```sh
npm run dev
```

For active development with auto-reload:
```sh
npm run watch
```

## Deployment

1. Build the application:
```sh
npm run build
```

2. Start in production mode:
```sh
npm start
```

## Bot Commands

### Deploy Discord Commands
```sh
npm run deploy-commands
```

### Remove Discord Commands
```sh
npm run delete-commands
```

## Code Quality

Run linting:
```sh
npm run lint
```

Apply automatic fixes:
```sh
npm run fix
```

## Type Checking

```sh
npm run typecheck
```

## Docker Support

A Dockerfile is included for containerized deployment. Build and run using:

```sh
docker build -t digital-marketplace-bot .
docker run -p 3000:3000 digital-marketplace-bot
```

## License

Private repository - All rights reserved
