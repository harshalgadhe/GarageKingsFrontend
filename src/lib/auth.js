// ============================================================================
// GARAGEKINGS LOCAL COOKIE-BASED AUTH REST CLIENT MODULE
// Optimized for secure local session authentication and owner setups
// ============================================================================

import { clearAllUserCarts } from './cart.js';

const API_BASE_URL = import.meta.env.PROD 
  ? '/api/v1' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

/**
 * Initiates local email/password login
 */
export async function signInCognito(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim(), password })
    });

    if (!response.ok) {
      let errorMsg = 'Authentication failed. Please verify credentials.';
      try {
        const data = await response.json();
        errorMsg = data.message || errorMsg;
      } catch (e) {
        try {
          const text = await response.text();
          if (text) errorMsg = text;
        } catch (_) {}
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();

    const { user } = data;
    localStorage.setItem('gk_user', JSON.stringify({
      email: user.email,
      userId: user.id,
      username: user.email,
      displayName: user.email.split('@')[0],
      role: user.role,
      roles: [user.role.toLowerCase()]
    }));
    // Notify all components that a new user is now active
    window.dispatchEvent(new Event('gk_user_updated'));

    return user;
  } catch (error) {
    console.error("Local signIn failed:", error);
    throw error;
  }
}

/**
 * Clears local cookies and logs out the user
 */
export async function signOutCognito() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.warn("Logout request failed, cleaning up local storage anyway:", e);
  }
  // Purge all user cart data to prevent cart leakage to the next user on this device
  clearAllUserCarts();
  localStorage.removeItem('gk_user');
  // Notify all components that the user has logged out
  window.dispatchEvent(new Event('gk_user_updated'));
}

/**
 * Fetches the currently authenticated user session details
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('gk_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

/**
 * Checks if first-startup setup has been run
 */
export async function getSetupStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/setup/status`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error("Failed to check setup status");
    return await res.json();
  } catch (e) {
    console.error("Failed to query setup status:", e);
    return { isSetupRequired: false };
  }
}

/**
 * Configures the first-time Owner account
 */
export async function setupOwner(email, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/setup/owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      let errorMsg = "Failed to configure Owner account.";
      try {
        const data = await res.json();
        errorMsg = data.message || errorMsg;
      } catch (e) {
        try {
          const text = await res.text();
          if (text) errorMsg = text;
        } catch (_) {}
      }
      throw new Error(errorMsg);
    }
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Owner setup failed:", e);
    throw e;
  }
}

// Cognito federated google login backward compatibility implementation
export async function signInWithGoogleProfile(googleIdToken) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ idToken: googleIdToken })
    });

    if (!response.ok) {
      let errorMsg = 'Google authentication sync failed.';
      try {
        const data = await response.json();
        errorMsg = data.message || errorMsg;
      } catch (e) {
        try {
          const text = await response.text();
          if (text) errorMsg = text;
        } catch (_) {}
      }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    const { user } = data;
    localStorage.setItem('gk_user', JSON.stringify({
      email: user.email,
      userId: user.id,
      username: user.email,
      displayName: user.email.split('@')[0],
      role: user.role,
      roles: [user.role.toLowerCase()]
    }));
    window.dispatchEvent(new Event('gk_user_updated'));

    return user;
  } catch (error) {
    console.error("Google authentication failed:", error);
    throw error;
  }
}

// Auto confirm backward compatibility stub
export async function autoConfirmUserBackend(email) {
  return { success: true };
}

export async function signUpCognito(email, password, name) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim(), password, fullName: name })
    });

    if (!response.ok) {
      let errorMsg = 'Registration failed. Please try again.';
      try {
        const data = await response.json();
        errorMsg = data.message || errorMsg;
      } catch (e) {
        try {
          const text = await response.text();
          if (text) errorMsg = text;
        } catch (_) {}
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const { user } = data;
    localStorage.setItem('gk_user', JSON.stringify({
      email: user.email,
      userId: user.id,
      username: user.email,
      displayName: user.email.split('@')[0],
      role: user.role,
      roles: [user.role.toLowerCase()]
    }));
    window.dispatchEvent(new Event('gk_user_updated'));

    return user;
  } catch (error) {
    console.error("Local signUp failed:", error);
    throw error;
  }
}

export async function confirmSignUpCognito(email, code) {
  return { success: true };
}

export function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT token decoding failed:", e);
    return null;
  }
}

