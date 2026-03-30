/* eslint-disable no-console */
/**
 * Simple application logger
 * Uses console output — Sentry handles exceptions, Grafana handles metrics
 */

export const logger = {
  debug: (...args: any[]) => console.debug('[app]', ...args),
  info: (...args: any[]) => console.info('[app]', ...args),
  warn: (...args: any[]) => console.warn('[app]', ...args),
  error: (...args: any[]) => console.error('[app]', ...args),
};
