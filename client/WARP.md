# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Helium10 session management dashboard** that consists of a React frontend (client) and Node.js/Express backend (server). The system manages encrypted Helium10 session tokens through an admin panel, allowing users to access premium Helium10 functionality via a browser extension.

## Key Architecture

### Frontend (React + Vite)
- **Authentication system**: Context-based auth with JWT tokens stored in localStorage
- **Role-based routing**: Admin-only routes protected with PrivateRoute component
- **Session management**: Helium10Page handles encrypted token copying and extension communication
- **Admin controls**: AdminPage for user management and session token configuration

### Backend (Node.js/Express)
- **Database**: SQLite with users and helium10_session tables
- **Authentication**: JWT-based with role differentiation (admin/user)
- **File handling**: Multer for extension zip uploads
- **Session encryption**: AES encryption for Helium10 tokens with specific key format

### Key Business Logic
- Admin uploads encrypted Helium10 session data
- Users click button to copy encrypted token to clipboard
- Browser extension reads token and enables premium features
- System validates user access expiration dates

## Development Commands

```bash
# Start both client and server in development mode
npm run dev

# Start only the server
npm run dev:server

# Start only the client  
npm run dev:client

# Build client for production
npm run build

# Start production server
npm start
```

## Important Constants

The system relies on these exact constants that must match between client and extension:
- `OMNIBOX_KEYWORD`: `'brandseotools(created-by-premiumtools.shop)'`
- `AES_KEY`: `'brandseotools(created-by-premiumtools.shop)iLFB0yJSdidhLStH6tNcfXMqo7L8qkdofk'`

## File Structure Notes

- **Client**: React SPA with pages in `src/pages/` and shared components in `src/components/`
- **Server**: Single `index.js` file with all API routes and database logic
- **Extension uploads**: Stored in `server/uploads/extension.zip`
- **Database**: SQLite file at `server/data.db`

## Admin Session Management

The admin-managed encrypted Helium10 session token is stored centrally and accessed by all users. The encryption/decryption process handles both raw cookie JSON and pre-encrypted payload formats to maintain compatibility with the browser extension.

## Authentication Flow

1. Users login with email/username + password
2. System checks role (admin/user) and access expiration
3. JWT token issued for 7 days
4. Frontend stores auth data in localStorage
5. API requests include Bearer token in Authorization header