/**
 * Configuration Manager for Judge0 Local Migration
 * 
 * Handles environment-based configuration management for Judge0 instances,
 * including RapidAPI rejection and endpoint validation.
 */

export interface RetryConfiguration {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface Judge0Configuration {
  endpoint: string;
  environment: 'development' | 'production';
  timeout: number;
  retryConfig: RetryConfiguration;
  healthCheckInterval: number;
}

export interface EnvironmentConfig {
  JUDGE0_ENDPOINT?: string;
  JUDGE0_TIMEOUT?: string;
  NODE_ENV: string;
  NEXT_PUBLIC_JUDGE0_ENDPOINT?: string;
  NEXT_PUBLIC_JUDGE0_API_URL?: string;
}

export class ConfigurationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private configuration: Judge0Configuration | null = null;
  private readonly RAPIDAPI_PATTERNS = [
    'rapidapi.com',
    'judge0-ce.p.rapidapi.com',
    'judge0.p.rapidapi.com',
    'p.rapidapi.com'
  ];

  private constructor() {}

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Get Judge0 endpoint from configuration
   */
  public getJudge0Endpoint(): string {
    if (!this.configuration) {
      this.loadConfiguration();
    }
    return this.configuration!.endpoint;
  }

  /**
   * Validate Judge0 endpoint URL format and accessibility
   */
  public async validateEndpoint(endpoint: string): Promise<boolean> {
    try {
      // Basic URL format validation
      const url = new URL(endpoint);
      
      // Check if it's a valid HTTP/HTTPS URL
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new ConfigurationError(
          `Invalid protocol: ${url.protocol}. Only HTTP and HTTPS are supported.`,
          'INVALID_PROTOCOL'
        );
      }

      // Note: RapidAPI endpoints are allowed and will have headers added by client.ts

      // Basic connectivity check (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${endpoint}/languages`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        clearTimeout(timeoutId);
        
        return response.ok;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ConfigurationError(
            `Endpoint validation timed out: ${endpoint}`,
            'VALIDATION_TIMEOUT'
          );
        }
        throw new ConfigurationError(
          `Failed to connect to endpoint: ${endpoint}. ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONNECTION_FAILED'
        );
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }
      throw new ConfigurationError(
        `Invalid endpoint URL: ${endpoint}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INVALID_URL'
      );
    }
  }

  /**
   * Set environment mode (development or production)
   */
  public setEnvironment(env: 'development' | 'production'): void {
    if (this.configuration) {
      this.configuration.environment = env;
    }
    // Reload configuration with new environment
    this.loadConfiguration();
  }

  /**
   * Check if RapidAPI is configured
   */
  public isRapidAPIConfigured(): boolean {
    const envConfig = this.getEnvironmentConfig();
    const endpoint = envConfig.JUDGE0_ENDPOINT || envConfig.NEXT_PUBLIC_JUDGE0_ENDPOINT;
    
    if (!endpoint) {
      return false;
    }

    return this.isRapidAPIEndpoint(endpoint);
  }

  /**
   * Get retry configuration
   */
  public getRetryConfig(): RetryConfiguration {
    if (!this.configuration) {
      this.loadConfiguration();
    }
    return this.configuration!.retryConfig;
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): Judge0Configuration {
    if (!this.configuration) {
      this.loadConfiguration();
    }
    return { ...this.configuration! };
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): void {
    try {
      const envConfig = this.getEnvironmentConfig();
      const environment = this.determineEnvironment(envConfig.NODE_ENV);
      
      // Note: RapidAPI endpoints are allowed — headers are handled by client.ts
      if (this.isRapidAPIConfigured()) {
        console.log(`[ConfigurationManager] RapidAPI endpoint detected, headers will be added by client.ts`);
      }

      const endpoint = this.resolveEndpoint(envConfig, environment);
      const timeout = this.parseTimeout(envConfig.JUDGE0_TIMEOUT);

      this.configuration = {
        endpoint,
        environment,
        timeout,
        retryConfig: {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 8000,
          backoffMultiplier: 2
        },
        healthCheckInterval: 30000 // 30 seconds
      };

      console.log(`[ConfigurationManager] Configuration loaded successfully for ${environment} environment: ${endpoint}`);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }
      this.handleConfigurationError(error as Error, 'loadConfiguration');
    }
  }

  /**
   * Get environment configuration from process.env
   */
  private getEnvironmentConfig(): EnvironmentConfig {
    return {
      JUDGE0_ENDPOINT: process.env.JUDGE0_ENDPOINT,
      JUDGE0_TIMEOUT: process.env.JUDGE0_TIMEOUT,
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_JUDGE0_ENDPOINT: process.env.NEXT_PUBLIC_JUDGE0_ENDPOINT,
      NEXT_PUBLIC_JUDGE0_API_URL: process.env.NEXT_PUBLIC_JUDGE0_API_URL
    };
  }

  /**
   * Determine environment from NODE_ENV
   */
  private determineEnvironment(nodeEnv: string): 'development' | 'production' {
    return nodeEnv === 'production' ? 'production' : 'development';
  }

  /**
   * Resolve Judge0 endpoint based on environment and configuration
   */
  private resolveEndpoint(envConfig: EnvironmentConfig, environment: 'development' | 'production'): string {
    // Check for explicit endpoints (including RapidAPI URL)
    const explicitEndpoint = envConfig.JUDGE0_ENDPOINT || envConfig.NEXT_PUBLIC_JUDGE0_ENDPOINT || envConfig.NEXT_PUBLIC_JUDGE0_API_URL;

    if (explicitEndpoint) {
      return explicitEndpoint;
    }

    if (environment === 'development') {
      // In development, default to 127.0.0.1:2358 if no endpoint specified
      return 'http://127.0.0.1:2358';
    } else {
      // In production, require explicit configuration
      throw new ConfigurationError(
        'Production environment requires explicit Judge0 endpoint configuration. Please set JUDGE0_ENDPOINT or NEXT_PUBLIC_JUDGE0_ENDPOINT environment variable.',
        'PRODUCTION_ENDPOINT_REQUIRED'
      );
    }
  }

  /**
   * Parse timeout from environment variable
   */
  private parseTimeout(timeoutStr?: string): number {
    if (!timeoutStr) {
      return 30000; // Default 30 seconds
    }

    const timeout = parseInt(timeoutStr, 10);
    if (isNaN(timeout) || timeout <= 0) {
      throw new ConfigurationError(
        `Invalid timeout value: ${timeoutStr}. Must be a positive integer.`,
        'INVALID_TIMEOUT'
      );
    }

    return timeout;
  }

  /**
   * Check if endpoint is a RapidAPI endpoint
   */
  private isRapidAPIEndpoint(endpoint: string): boolean {
    const lowercaseEndpoint = endpoint.toLowerCase();
    return this.RAPIDAPI_PATTERNS.some(pattern => 
      lowercaseEndpoint.includes(pattern.toLowerCase())
    );
  }

  /**
   * Reset configuration (for testing purposes)
   */
  public resetConfiguration(): void {
    this.configuration = null;
  }

  /**
   * Get current environment mode
   */
  public getEnvironment(): 'development' | 'production' {
    if (!this.configuration) {
      this.loadConfiguration();
    }
    return this.configuration!.environment;
  }

  /**
   * Check if running in development mode
   */
  public isDevelopmentMode(): boolean {
    return this.getEnvironment() === 'development';
  }

  /**
   * Check if running in production mode
   */
  public isProductionMode(): boolean {
    return this.getEnvironment() === 'production';
  }

  /**
   * Validate current configuration
   */
  public async validateCurrentConfiguration(): Promise<boolean> {
    try {
      const config = this.getConfiguration();
      return await this.validateEndpoint(config.endpoint);
    } catch (error) {
      console.error('[ConfigurationManager] Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Get configuration summary for debugging
   */
  public getConfigurationSummary(): {
    endpoint: string;
    environment: 'development' | 'production';
    timeout: number;
    isRapidAPI: boolean;
    isValid: boolean;
  } {
    try {
      const config = this.getConfiguration();
      return {
        endpoint: config.endpoint,
        environment: config.environment,
        timeout: config.timeout,
        isRapidAPI: this.isRapidAPIConfigured(),
        isValid: true
      };
    } catch (error) {
      return {
        endpoint: 'INVALID',
        environment: 'development',
        timeout: 30000,
        isRapidAPI: this.isRapidAPIConfigured(),
        isValid: false
      };
    }
  }

  /**
   * Handle configuration errors gracefully
   */
  private handleConfigurationError(error: Error, context: string): never {
    const errorMessage = `Configuration error in ${context}: ${error.message}`;
    console.error(`[ConfigurationManager] ${errorMessage}`);
    
    if (error instanceof ConfigurationError) {
      throw error;
    }
    
    throw new ConfigurationError(errorMessage, 'CONFIGURATION_ERROR');
  }
}

// Export singleton instance
export const configurationManager = ConfigurationManager.getInstance();