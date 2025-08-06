# SecureChat Frontend

This repository contains the frontend for **SecureChat**, a real-time chat application with end-to-end encryption. The frontend is built with Vite, React, React Router, and integrates Web Crypto API for client-side encryption, along with Axios and Socket.IO for communication with the backend.

---

## Table of Contents

* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Environment Variables](#environment-variables)
* [Development](#development)
* [Production Build](#production-build)
* [Project Structure](#project-structure)
* [Key Components](#key-components)
* [Encryption Flow](#encryption-flow)
* [License](#license)

---

## Features

* **Wallet-based Authentication** via Ethereum signatures (MetaMask).
* **Client-Side RSA Key Management**: Generate and store RSA-OAEP key pairs in `localStorage`.
* **AES-GCM Encryption**: Encrypt/decrypt chat messages in the browser using Web Crypto API.
* **Real-Time Messaging** with Socket.IO.
* **Responsive UI** built with React and CSS modules.
* **Protected Routes** using React Router and a custom `ProtectedRoute` component.

---

## Prerequisites

* Node.js (v18+)
* npm or yarn
* MetaMask browser extension (for wallet login)

---

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/securechat-frontend.git
   cd securechat-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

---

## Environment Variables

Create a `.env` file in the project root or set environment variables prefixed with `VITE_`:

```bash
VITE_API_BASE_URL=https://your-backend-domain.com
```

* `VITE_API_BASE_URL`: URL of the SecureChat backend API.

---

## Development

Run the development server with hot-reload:

```bash
npm run dev
# or
yarn dev
```

Open the app in your browser at `http://localhost:5173` (or the URL shown in the terminal).

---

## Production Build

Build the optimized production bundle:

```bash
npm run build
# or
yarn build
```

Preview the production build locally:

```bash
npm run preview
# or
yarn preview
```

---

## Project Structure

```
frontend/
├─ public/                # Static assets (logo, index.html)
├─ src/
│  ├─ App.js              # Routes & layout (Navbar, ProtectedRoute)
│  ├─ auth/               # Auth context & hooks
│  ├─ components/         # React components
│  │   ├─ Login.jsx
│  │   ├─ RoomChat.jsx
│  │   ├─ ManageRoom.jsx
│  │   ├─ CreateRoom.jsx
│  │   ├─ EditRoom.jsx
│  │   ├─ InvitePage.jsx
│  │   ├─ SearchRooms.jsx
│  │   ├─ UserInvites.jsx
│  │   └─ FriendsPage.jsx
│  ├─ css/                # Component-specific CSS files
│  ├─ auth/               # Authentication context/provider
│  └─ index.jsx           # Vite entry point
├─ .env                   # Environment variables
└─ vite.config.js         # Vite configuration
```

---

## Key Components

### `Login.jsx`

* Connects to MetaMask, requests nonce, signs it.
* Generates/imports RSA-OAEP key pair in `localStorage`.
* Sends address, signature, and public key to `POST /api/auth/login`.

### `RoomChat.jsx`

* Fetches room metadata and user ID on mount.
* Manages WebSocket connection to backend with JWT cookie.
* Decrypts room keys (RSA-OAEP) and stores AES-GCM keys by version.
* Loads and decrypts historic and live messages.
* Handles key rotation events and updates keys.
* Renders chat UI, message list, online users, and input.

### `ManageRoom.jsx`

* Allows room owner to view participants and pending join requests.
* Provides kick, accept, and deny actions via API calls.
* Updates UI state accordingly.

### `ProtectedRoute.jsx`

* Checks authentication state and redirects to `/login` if unauthorized.

### `Navbar` & Layout

* Responsive navigation showing links based on auth state.
* Logout triggers `POST /api/auth/logout` and reloads.

---

## Encryption Flow

1. **RSA Key Pair**: Generated on first login (JWK stored client-side).
2. **Fetch Nonce & Sign**: Prove wallet ownership.
3. **Login & Public Key Upload**: Server issues JWT cookie.
4. **Room Join**: On `joinRoom`, server returns encrypted AES keys.
5. **Key Decryption**: Decrypt AES keys with RSA private key.
6. **Message Encryption**: Encrypt with AES-GCM + random IV before sending.
7. **Message Decryption**: Decrypt messages in browser upon receipt.
8. **Key Rotation**: Handle `roomKeyUpdated` to import new AES keys.

---
