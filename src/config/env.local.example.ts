/**
 * Template for your machine-local backend address.
 *
 * `scripts/setup-env.js` copies this to `env.local.ts` (gitignored) on
 * `npm install` if it isn't there yet. Edit that copy, never this file.
 *
 * Leave HOST_OVERRIDE as null to use the emulator/simulator defaults in
 * env.ts. Set it to your computer's LAN IP (e.g. '192.168.1.9') when running
 * on a physical device on the same Wi-Fi — find it with `ipconfig` on
 * Windows or `ipconfig getifaddr en0` on macOS.
 */
export const HOST_OVERRIDE: string | null = null;
