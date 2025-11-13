import { useEffect } from 'react';

/**
 * Auto-save form data to localStorage on every change
 * @param {string} key - localStorage key (e.g., 'onboarding_step1')
 * @param {object} data - form data to save
 * @param {number} debounceMs - delay before saving (default 500ms)
 */
export const useAutoSave = (key, data, debounceMs = 500) => {
  useEffect(() => {
    // Debounce to avoid saving on every keystroke
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`✓ Auto-saved: ${key}`);
      } catch (error) {
        console.error(`Failed to auto-save ${key}:`, error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [key, data, debounceMs]);
};

/**
 * Load saved form data from localStorage
 * @param {string} key - localStorage key
 * @param {object} defaultData - default values if no saved data exists
 * @returns {object} saved data or default data
 */
export const loadSavedData = (key, defaultData = {}) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      console.log(`✓ Loaded saved data: ${key}`);
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
  }
  return defaultData;
};

/**
 * Merge parsed resume data with manually entered data
 * Prioritizes manually entered data over parsed data
 */
export const mergeWithResumeData = (manualData, resumeData, stepKey) => {
  if (!resumeData?.prefill?.[stepKey]) return manualData;
  
  const merged = { ...resumeData.prefill[stepKey] };
  
  // Override with any manually entered data
  Object.keys(manualData).forEach(key => {
    if (manualData[key] !== '' && manualData[key] !== null && manualData[key] !== undefined) {
      // Check if it's actually different from default empty values
      if (typeof manualData[key] === 'string' && manualData[key].length > 0) {
        merged[key] = manualData[key];
      } else if (typeof manualData[key] === 'boolean') {
        merged[key] = manualData[key];
      } else if (Array.isArray(manualData[key]) && manualData[key].length > 0) {
        merged[key] = manualData[key];
      }
    }
  });
  
  return merged;
};










