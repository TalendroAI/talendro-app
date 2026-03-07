/**
 * Utility functions for interview components.
 * Replaces @/lib/utils from the original Vite/shadcn project.
 */

/**
 * cn — Combine class names, filtering out falsy values.
 * Lightweight replacement for clsx + tailwind-merge.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
