import * as Sentry from '@sentry/react';
import { getCurrentUser } from './auth';

const API_BASE_URL = import.meta.env.PROD 
  ? '/api/v1' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

let currentCorrelationId = '';

export function getSessionCorrelationId() {
  if (typeof window === 'undefined') return 'GK-TR-SSR-UNKNOWN';
  
  if (!currentCorrelationId) {
    let storedId = sessionStorage.getItem('gk_correlation_id');
    if (!storedId) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
      storedId = `GK-TR-FE-${today}-${rand}`;
      sessionStorage.setItem('gk_correlation_id', storedId);
    }
    currentCorrelationId = storedId;
  }
  return currentCorrelationId;
}

export function initTelemetry() {
  if (typeof window === 'undefined') return;

  // Initialize Correlation ID for this session
  getSessionCorrelationId();

  // Initialize Sentry if DSN is provided
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    console.log('✔ Sentry initialized on frontend.');
  }

  // Handle global JS errors
  window.addEventListener('error', (event) => {
    const message = event.message || (event.error && event.error.message) || 'Unknown global error';
    const stack = event.error ? event.error.stack : '';
    logError(message, stack, 'error');
  });

  // Handle unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : '';
    logError(`Unhandled Rejection: ${message}`, stack, 'error');
  });

  console.log('✔ Telemetry logging initialized.');
}

export async function logError(message, stack = '', level = 'error') {
  try {
    const user = getCurrentUser();
    let safeStack = '';
    if (stack) {
      try {
        safeStack = btoa(unescape(encodeURIComponent(stack)));
      } catch (e) {
        safeStack = stack;
      }
    }

    const payload = {
      source: 'frontend',
      level,
      message,
      stack: safeStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userEmail: user ? user.email : null,
      correlationId: getSessionCorrelationId()
    };

    // Forward exception to Sentry if initialized
    try {
      if (sentryDsnConfigured()) {
        Sentry.withScope((scope) => {
          scope.setLevel(level === 'warning' ? 'warning' : 'error');
          if (user) {
            scope.setUser({ email: user.email, id: user.userId });
          }
          scope.setExtra('stackTrace', stack);
          Sentry.captureException(new Error(message));
        });
      }
    } catch (sentryErr) {
      // Ignore Sentry dispatch errors
    }

    // Keep telemetry on the signed fetch path. sendBeacon bypasses the global
    // payload-hash interceptor required by the CloudFront origin policy.
    await fetch(`${API_BASE_URL}/telemetry/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to send error telemetry:', err);
  }
}

function sentryDsnConfigured() {
  try {
    return !!import.meta.env.VITE_SENTRY_DSN;
  } catch (e) {
    return false;
  }
}
