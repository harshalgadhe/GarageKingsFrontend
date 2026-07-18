/**
 * cart.js — User-scoped cart persistence utility
 *
 * Design rules:
 * - Every authenticated user has their own isolated cart key: gk_cart_{userId}
 * - Unauthenticated access is blocked at the UI layer (no guest cart)
 * - Cart is cleared on logout and when a different user logs in
 * - All consumers use these helpers — never access localStorage directly
 */

import { getCurrentUser } from './auth';

/**
 * Returns the localStorage key for the current user's cart.
 * Returns null if no user is authenticated (cart should not be accessible).
 */
export function getCartKey() {
  const user = getCurrentUser();
  if (!user?.userId) return null;
  return `gk_cart_${user.userId}`;
}

/**
 * Reads the current user's cart from localStorage.
 * Returns [] if unauthenticated or cart is empty/corrupt.
 */
export function readCart() {
  const key = getCartKey();
  if (!key) return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

/**
 * Writes the cart array to the current user's scoped localStorage key.
 * No-ops if unauthenticated.
 */
export function writeCart(items) {
  const key = getCartKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(items));
}

/**
 * Clears the current user's cart from localStorage.
 * Also dispatches a gk_cart_updated event so all components update.
 */
export function clearCart() {
  const key = getCartKey();
  if (key) localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent('gk_cart_updated', { detail: { open: false } }));
}

/**
 * Clears ALL gk_cart_* keys from localStorage.
 * Called on logout to ensure no cart data leaks across sessions.
 */
export function clearAllUserCarts() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('gk_cart_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent('gk_cart_updated', { detail: { open: false } }));
}

/**
 * Dispatches cart update event so all components re-read their state.
 */
export function notifyCartUpdated() {
  window.dispatchEvent(new CustomEvent('gk_cart_updated', { detail: { open: false } }));
}
