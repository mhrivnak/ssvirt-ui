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
    console.log('Runtime config already loaded:', runtimeConfig);
    return runtimeConfig;
  }

  console.log('Attempting to load runtime config from /config.json...');

  try {
    const response = await fetch('/config.json');
    console.log('Config fetch response:', response.status, response.statusText);

    if (response.ok) {
      const config = (await response.json()) as RuntimeConfig;
      runtimeConfig = { ...DEFAULT_CONFIG, ...config };
      console.log(
        '✅ Successfully loaded runtime configuration from /config.json:',
        runtimeConfig
      );
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Failed to load /config.json:', error);
    console.warn('Using environment defaults:', DEFAULT_CONFIG);
    runtimeConfig = DEFAULT_CONFIG;
  }

  console.log('Final runtime config being used:', runtimeConfig);
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
