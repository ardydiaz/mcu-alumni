import { ConfidentialClientApplication, LogLevel } from '@azure/msal-node';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Microsoft Entra ID (Azure AD) app registration used for "Sign in with Microsoft 365".
export const m365Config = {
  ...env.m365,
  // Single-tenant authority: only accounts from the MCU tenant can sign in.
  authority: `https://login.microsoftonline.com/${env.m365.tenantId}`,
  scopes: ['openid', 'profile', 'email'],
};

let client = null;

export function getMsalClient() {
  if (!m365Config.enabled) throw new Error('Microsoft 365 sign-in is not configured');
  client ??= new ConfidentialClientApplication({
    auth: {
      clientId: m365Config.clientId,
      authority: m365Config.authority,
      clientSecret: m365Config.clientSecret,
    },
    system: {
      loggerOptions: {
        piiLoggingEnabled: false,
        logLevel: LogLevel.Warning,
        loggerCallback: (level, message) => (level === LogLevel.Error ? logger.error(`[msal] ${message}`) : logger.warn(`[msal] ${message}`)),
      },
    },
  });
  return client;
}
