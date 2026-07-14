

import { Platform } from 'react-native';

/**
 * STEP 1 — Set your backend machine's address here.
 *
 * - If you run the app on the Android EMULATOR, keep '10.0.2.2' — this is a
 *   special alias the Android emulator uses to reach your computer's
 *   localhost. Do NOT put your real IP here for the emulator.
 * - If you run the app on the iOS SIMULATOR, 'localhost' works fine.
 * - If you run the app on a REAL PHONE (Android or iOS) on the same Wi-Fi
 *   network as your computer, replace BOTH values below with your
 *   computer's LAN IP address (e.g. '192.168.1.23'). You can find it with
 *   `ipconfig` (Windows) or `ifconfig`/`ipconfig getifaddr en0` (Mac).
 */
// const HOST = Platform.select({
//   android: '10.0.2.2', // emulator alias for your PC's localhost
//   ios: 'localhost',
//   default: 'localhost',
// });

// 👉 If testing on a physical device, uncomment the line below and set your
// computer's LAN IP. This overrides the emulator/simulator defaults above.
const HOST = '192.168.1.9';

/**
 * STEP 2 — Ports for each microservice.
 * These match the `http` profile in each service's launchSettings.json.
 * Update only if you change the port a service runs on.
 */
const PORTS = {
  auth: 5090, // AuthService
  user: 5256, // UserService
  notification: 5140, // NotificationService
  report: 5173, // ReportService
};

/**
 * STEP 3 — Base URLs, built automatically from HOST + PORTS above.
 * Everything below this line should NOT need manual edits.
 */
export const API_BASE_URLS = {
  auth: `http://${HOST}:${PORTS.auth}/api`,
  user: `http://${HOST}:${PORTS.user}/api`,
  notification: `http://${HOST}:${PORTS.notification}/api`,
  report: `http://${HOST}:${PORTS.report}/api`,
};

/**
 * STEP 4 — Endpoint paths, grouped by service/controller.
 * These map 1:1 to the [HttpPost]/[HttpGet] routes on the .NET controllers.
 */
export const API_ENDPOINTS = {
  auth: {
    register: '/Auth/Register', // farmer self sign-up (sends OTP)
    createExpert: '/Auth/CreateExpert', // expert sign-up (pending approval)
    login: '/Auth/Login', // login by phone number (sends OTP)
    loginWithEmail: '/Auth/LoginWithEmail', // login by email + password
    forgetPassword: '/Auth/ForgetPassword',
    resetPassword: '/Auth/ResetPassword',
    verifyOtp: '/Auth/Verify-OTP',
    logout: '/Auth/Logout',
    refreshToken: '/Auth/Refresh-Token',
  },
  user: {
    details: '/User/details',
    all: '/User/all',
    update: '/User/update',
    block: (userId: string) => `/User/Block/${userId}`,
    approve: (userId: string) => `/User/Approved/${userId}`,
    delete: (userId: string) => `/User/Delete/${userId}`,
  },
};

/** Generic request timeout (ms) used by apiClient. */
export const API_TIMEOUT_MS = 15000;
