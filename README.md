# Shelf Auth App

A React application for testing PocketBase OAuth2 authentication with Google, Apple, and Spotify.

## Setup

1. **Clone the repository:**
   ```bash
   git clone git@github.com:luizcieslak/shelf.git
   cd shelf
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your PocketBase URL (default: `http://127.0.0.1:8090`)

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

## PocketBase Configuration

To test OAuth2 authentication, you'll need to configure your PocketBase instance:

1. **Start PocketBase:**
   ```bash
   ./pocketbase serve
   ```

2. **Configure OAuth2 providers in PocketBase admin:**
   - Navigate to `http://127.0.0.1:8090/_/`
   - Go to Settings → Auth providers
   - Configure the following providers:

### Google OAuth2
- **Client ID**: Your Google OAuth2 client ID
- **Client Secret**: Your Google OAuth2 client secret
- **Redirect URL**: `http://127.0.0.1:8090/api/oauth2-redirect`

### Apple OAuth2
- **Client ID**: Your Apple OAuth2 client ID
- **Client Secret**: Your Apple OAuth2 client secret (or private key)
- **Redirect URL**: `http://127.0.0.1:8090/api/oauth2-redirect`

### Spotify OAuth2
- **Client ID**: Your Spotify OAuth2 client ID
- **Client Secret**: Your Spotify OAuth2 client secret
- **Redirect URL**: `http://127.0.0.1:8090/api/oauth2-redirect`

## Features

- Modern React 18 with TypeScript
- Tailwind CSS for styling
- PocketBase SDK integration
- OAuth2 authentication for:
  - Google
  - Apple
  - Spotify
- Responsive login screen
- User session management

## Project Structure

```
src/
├── components/
│   └── LoginScreen.tsx    # Main login component with OAuth2 buttons
├── App.tsx               # Main app component with auth state
├── main.tsx             # React entry point
└── index.css            # Tailwind CSS imports
```