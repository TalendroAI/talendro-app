/**
 * useToast — Lightweight toast notification hook.
 * Replaces shadcn's @/hooks/use-toast for the interview components.
 * Uses a simple DOM-based approach compatible with CRA.
 */
import { useCallback } from 'react';

let toastContainer = null;

function getContainer() {
  if (toastContainer) return toastContainer;
  toastContainer = document.createElement('div');
  toastContainer.id = 'interview-toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
}

function showToast({ title, description, variant = 'default', duration = 4000 }) {
  const container = getContainer();
  const el = document.createElement('div');
  const isDestructive = variant === 'destructive';
  el.style.cssText = `
    background: ${isDestructive ? '#EF4444' : '#1F2937'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    max-width: 320px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    pointer-events: auto;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.2s, transform 0.2s;
  `;
  el.innerHTML = `
    ${title ? `<div style="font-weight:600;font-size:14px;margin-bottom:${description ? '4px' : '0'}">${title}</div>` : ''}
    ${description ? `<div style="font-size:13px;opacity:0.9">${description}</div>` : ''}
  `;
  container.appendChild(el);
  // Animate in
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  // Auto-remove
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 200);
  }, duration);
}

export function useToast() {
  const toast = useCallback((options) => {
    showToast(options);
  }, []);
  return { toast };
}
