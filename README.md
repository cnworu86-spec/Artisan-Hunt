# Final Year Project

This repository contains the codebase for the Final Year Project, consisting of three main components: a Node.js backend, a React Native mobile application, and a React-based admin dashboard.

## Prerequisites

Before running the project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- For the mobile app: [Expo Go](https://expo.dev/client) installed on your physical device, or an iOS Simulator / Android Emulator.

---

## 1. Backend Setup (Node.js/Express)

The backend is a REST API that handles data, authentication, and database connections.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Configuration:
   - Create a `.env` file in the root of the `backend` directory.
   - You will need to configure environment variables such as your MongoDB URI, JWT Secrets, and Port number based on your environment.
   - If using Firebase services, ensure the `serviceAccountKey.json` is placed in the backend directory (or wherever configured).
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The server will start (default is usually port 3000, 5000, or 8080).*

---

## 2. Mobile App Setup (React Native + Expo)

The mobile application is built with React Native and Expo.

1. Open a new terminal and navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npm start
   npx expo start --tunnel // to bypass local connection restrictions
   npx expo run:ios

   ```
4. Running the app:
   - **Physical Device**: Scan the QR code presented in the terminal using the Expo Go app on your phone.
   - **Simulator**: Press `i` to open in iOS simulator, or `a` to open in Android emulator (ensure they are installed and running).

---

## 3. Admin Panel Setup (React + Vite)

The admin dashboard is a React web application built with Vite for managing the platform.

1. Open a new terminal and navigate to the admin directory:
   ```bash
   cd admin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the provided local URL (usually `http://localhost:5173`) in your web browser.

---

## Notes
- Be sure to never commit your `.env` or sensitive JSON key files (like `serviceAccountKey.json`) to GitHub. They should remain in your `.gitignore`.
