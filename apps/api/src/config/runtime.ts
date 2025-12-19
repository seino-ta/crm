export type NodeEnv = 'development' | 'test' | 'production';

export type RuntimeConfig = {
  nodeEnv: NodeEnv;
  port: number;
  logLevel: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  security: {
    bcryptSaltRounds: number;
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };
};

let runtimeConfig: RuntimeConfig | null = null;

export function setRuntimeConfig(config: RuntimeConfig): void {
  runtimeConfig = config;
}

export function ensureRuntimeConfig(config?: RuntimeConfig): RuntimeConfig {
  if (!runtimeConfig) {
    if (!config) {
      throw new Error('Runtime config has not been initialized');
    }
    runtimeConfig = config;
  }
  return runtimeConfig;
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!runtimeConfig) {
    throw new Error('Runtime config has not been initialized');
  }
  return runtimeConfig;
}
