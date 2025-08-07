// Runtime configuration loader
export interface RuntimeConfig {
  apiBaseUrl: string;
  appTitle: string;
  appVersion: string;
  logoUrl: string;
}

// Default configuration as fallback
const DEFAULT_CONFIG: RuntimeConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  appTitle: import.meta.env.VITE_APP_TITLE || 'SSVIRT Web UI',
  appVersion: import.meta.env.VITE_APP_VERSION || '0.0.1',
  logoUrl: import.meta.env.VITE_LOGO_URL || '/vite.svg',
};

let runtimeConfig: RuntimeConfig | null = null;

/**
 * Load runtime configuration from /config.json
 * Falls back to environment variables if config.json is not available
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      const config = (await response.json()) as RuntimeConfig;
      runtimeConfig = { ...DEFAULT_CONFIG, ...config };
      console.log('Loaded runtime configuration from /config.json');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn(
      'Failed to load /config.json, using environment defaults:',
      error
    );
    runtimeConfig = DEFAULT_CONFIG;
  }

  return runtimeConfig;
}

/**
 * Get the current runtime configuration
 * Must call loadRuntimeConfig() first
 */
export function getRuntimeConfig(): RuntimeConfig {
  if (!runtimeConfig) {
    throw new Error(
      'Runtime configuration not loaded. Call loadRuntimeConfig() first.'
    );
  }
  return runtimeConfig;
}

/**
 * Reset the runtime configuration (useful for testing)
 */
export function resetRuntimeConfig(): void {
  runtimeConfig = null;
}
