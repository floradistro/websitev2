/**
 * PWA Version Management
 *
 * Tracks app version and detects when user needs to reinstall
 * for major updates (iOS/iPadOS PWA limitations).
 */

// Current app version (sync with package.json)
export const APP_VERSION = "0.1.0";

// Version storage key
const VERSION_KEY = "whaletools-pwa-version";

/**
 * Get the currently installed PWA version
 */
export function getInstalledVersion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VERSION_KEY);
}

/**
 * Save the current version to storage
 */
export function saveInstalledVersion(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VERSION_KEY, APP_VERSION);
}

/**
 * Check if PWA needs reinstall due to version change
 * Returns true if installed version doesn't match current version
 */
export function needsReinstall(): boolean {
  const installed = getInstalledVersion();

  // First install - no reinstall needed
  if (!installed) {
    saveInstalledVersion();
    return false;
  }

  // Version mismatch - needs reinstall
  if (installed !== APP_VERSION) {
    return true;
  }

  return false;
}

/**
 * Check if this is a PWA installation
 */
export function isPWA(): boolean {
  if (typeof window === "undefined") return false;

  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const fullscreen = window.matchMedia("(display-mode: fullscreen)").matches;

  return standalone || fullscreen;
}

/**
 * Parse version string to comparable number
 * e.g., "0.1.0" -> 0.001000, "0.11.2" -> 0.011002
 */
export function parseVersion(version: string): number {
  const parts = version.split(".").map((p) => parseInt(p, 10) || 0);
  const [major = 0, minor = 0, patch = 0] = parts;
  return major + minor / 1000 + patch / 1000000;
}

/**
 * Compare two versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const n1 = parseVersion(v1);
  const n2 = parseVersion(v2);

  if (n1 > n2) return 1;
  if (n1 < n2) return -1;
  return 0;
}

/**
 * Get version change type
 */
export function getVersionChangeType(
  oldVersion: string,
  newVersion: string
): "major" | "minor" | "patch" | "none" {
  const [oldMajor, oldMinor, oldPatch] = oldVersion.split(".").map((p) => parseInt(p, 10) || 0);
  const [newMajor, newMinor, newPatch] = newVersion.split(".").map((p) => parseInt(p, 10) || 0);

  if (newMajor > oldMajor) return "major";
  if (newMinor > oldMinor) return "minor";
  if (newPatch > oldPatch) return "patch";
  return "none";
}
