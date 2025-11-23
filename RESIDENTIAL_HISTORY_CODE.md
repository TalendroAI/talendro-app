# Residential History Field - Complete Code Documentation

This document contains all code related to the residential history field functionality, organized by the 4 key questions.

---

## 1. How Time is Calculated and Displayed in a Residence

### A. Calculate Duration of a Single Residence (in years)

**Location:** `server/backups/format-backup-2025-11-07T16-32-11-435Z/Onb3.js` (lines 251-273)

```javascript
// Calculate duration of a single residence in years
const calculateResidenceYears = (res) => {
  if (!res.fromDate) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(res.fromDate);
  startDate.setHours(0, 0, 0, 0);
  
  let endDate;
  if (res.current) {
    endDate = today;
  } else if (res.toDate) {
    endDate = new Date(res.toDate);
    endDate.setHours(0, 0, 0, 0);
  } else {
    return 0; // No end date and not current
  }
  
  const daysDiff = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
  return daysDiff / 365.25; // Convert to years
};
```

### B. Calculate Total Years Covered by All Residences

**Location:** `server/backups/format-backup-2025-11-07T16-32-11-435Z/Onb3.js` (lines 275-324)

```javascript
// Calculate total years covered by residential history
const residentialHistoryCoverage = useMemo(() => {
  const REQUIRED_YEARS = 7;
  
  if (!residences || residences.length === 0) {
    return {
      totalYears: 0,
      remainingYears: REQUIRED_YEARS,
      isComplete: false
    };
  }
  
  let totalDays = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  residences.forEach(res => {
    if (!res.fromDate) return; // Skip if no start date
    
    const startDate = new Date(res.fromDate);
    startDate.setHours(0, 0, 0, 0);
    
    let endDate;
    if (res.current) {
      // For current residence, use today as end date
      endDate = today;
    } else if (res.toDate) {
      endDate = new Date(res.toDate);
      endDate.setHours(0, 0, 0, 0);
    } else {
      // Skip if no end date and not current
      return;
    }
    
    // Calculate days difference
    const daysDiff = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
    totalDays += daysDiff;
  });
  
  // Convert days to years (approximate - 365.25 days per year to account for leap years)
  const totalYears = totalDays / 365.25;
  const remainingYears = Math.max(0, REQUIRED_YEARS - totalYears);
  const isComplete = totalYears >= REQUIRED_YEARS;
  
  return {
    totalYears: Math.round(totalYears * 100) / 100, // Round to 2 decimal places
    remainingYears: Math.round(remainingYears * 100) / 100,
    isComplete
  };
}, [residences]);
```

### C. Alternative Calculation Method (Months-based)

**Location:** `server/backups/format-backup-2025-11-07T16-32-11-435Z/Onb3.js` (lines 185-209)

```javascript
// Calculate total years of residential history
const calculateResidentialYears = (addresses) => {
  let totalMonths = 0;
  
  addresses.forEach(addr => {
    if (!addr.fromDate) return;
    
    const startDate = new Date(addr.fromDate);
    let endDate;
    
    if (addr.current || !addr.toDate) {
      endDate = new Date(); // Current date if still living there
    } else {
      endDate = new Date(addr.toDate);
    }
    
    // Calculate difference in months
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    
    totalMonths += Math.max(0, months);
  });
  
  return (totalMonths / 12).toFixed(2); // Convert to years with 2 decimals
};
```

---

## 2. How the System Decides When an Additional Residential History Entry Form is Required

**Location:** `server/backups/format-backup-2025-11-07T16-32-11-435Z/Onb3.js` (lines 326-427)

```javascript
// Dynamically add/remove residence entries based on manually-added residences' coverage
useEffect(() => {
  const REQUIRED_YEARS = 7;
  
  // Separate manually-added from auto-added residences
  const manuallyAdded = residences.filter(r => !r.autoAdded);
  const autoAdded = residences.filter(r => r.autoAdded);
  
  // Only proceed if we have at least one manually-added residence with complete dates
  if (manuallyAdded.length === 0) return;
  
  // Calculate total years covered by manually-added residences with valid dates
  let totalDays = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let hasCompleteResidence = false;
  
  manuallyAdded.forEach(res => {
    if (!res.fromDate) return; // Skip if no start date
    
    // Check if this residence has complete date information
    const hasEndDate = res.current || res.toDate;
    if (!hasEndDate) return; // Skip if no end date and not current
    
    hasCompleteResidence = true;
    
    const startDate = new Date(res.fromDate);
    startDate.setHours(0, 0, 0, 0);
    
    let endDate;
    if (res.current) {
      endDate = today;
    } else {
      endDate = new Date(res.toDate);
      endDate.setHours(0, 0, 0, 0);
    }
    
    const daysDiff = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
    totalDays += daysDiff;
  });
  
  // Don't do anything until at least one manually-added residence has complete dates
  if (!hasCompleteResidence) {
    // If we have auto-added residences but no complete manually-added ones, remove them
    if (autoAdded.length > 0) {
      setResidences(manuallyAdded);
    }
    return;
  }
  
  const totalYears = totalDays / 365.25;
  const remainingYears = Math.max(0, REQUIRED_YEARS - totalYears);
  const isComplete = totalYears >= REQUIRED_YEARS;
  
  // If coverage is complete, remove all auto-added residences
  if (isComplete && autoAdded.length > 0) {
    setResidences(manuallyAdded);
    return;
  }
  
  // If coverage is incomplete, ensure we have enough auto-added residences
  if (!isComplete && remainingYears > 0.5) {
    // Calculate how many auto-added residences we should have
    // Assume each residence might cover 2-4 years, so roughly one per 3 years needed
    const estimatedEntriesNeeded = Math.ceil(remainingYears / 3);
    const entriesNeeded = Math.min(estimatedEntriesNeeded, 4); // Max 4 auto-added
    
    // If we don't have enough auto-added residences, add more
    if (autoAdded.length < entriesNeeded) {
      const toAdd = entriesNeeded - autoAdded.length;
      const newAutoAdded = [];
      const maxId = Math.max(...residences.map(r => r.id), 0);
      
      for (let i = 0; i < toAdd; i++) {
        newAutoAdded.push({
          id: maxId + i + 1,
          street: '',
          city: '',
          state: '',
          zip: '',
          fromDate: '',
          toDate: '',
          current: false,
          autoAdded: true
        });
      }
      
      setResidences([...manuallyAdded, ...autoAdded, ...newAutoAdded]);
    }
    // If we have too many auto-added residences, remove excess
    else if (autoAdded.length > entriesNeeded) {
      const toKeep = autoAdded.slice(0, entriesNeeded);
      setResidences([...manuallyAdded, ...toKeep]);
    }
  }
  // If we have auto-added residences but they're no longer needed
  else if (remainingYears <= 0.5 && autoAdded.length > 0) {
    setResidences(manuallyAdded);
  }
  
  // Only run this effect when residence dates change (create a dependency string from all dates)
}, [residences.map(r => `${r.id}-${r.fromDate}-${r.toDate}-${r.current}`).join('|')]);
```

**Key Logic:**
- **Requirement:** 7 years of coverage
- **Trigger:** When manually-added residences have complete dates (fromDate + either toDate OR current=true)
- **Calculation:** `remainingYears = 7 - totalYears`
- **Auto-add condition:** `if (!isComplete && remainingYears > 0.5)`
- **Number of forms to add:** `Math.ceil(remainingYears / 3)` (max 4 auto-added forms)
- **Assumption:** Each residence covers 2-4 years, so roughly one form per 3 years needed

---

## 3. How the First History Entry Form Stays Editable After Additional Forms are Added

**Location:** `server/backups/format-backup-2025-11-07T16-32-11-435Z/Onb3.js` (lines 211-249)

The key is that **all forms remain editable** - there's no code that disables the first form. The system distinguishes between:

1. **Manually-added residences** (`autoAdded: false`) - These are always editable
2. **Auto-added residences** (`autoAdded: true`) - These are also editable, but can be automatically removed

```javascript
const addResidence = () => {
  const newId = residences.length + 1;
  setResidences([...residences, {
    id: newId,
    street: '',
    city: '',
    state: '',
    zip: '',
    fromDate: '',
    toDate: '',
    current: false,
    autoAdded: false // Manually added by user
  }]);
};

const updateResidence = (id, field, value) => {
  setResidences(residences.map(res =>
    res.id === id ? {...res, [field]: value} : res
  ));
};

const toggleCurrentResidence = (id) => {
  setResidences(residences.map(res => {
    if (res.id === id) {
      const newCurrent = !res.current;
      // If checking "Current", clear toDate; if unchecking, keep existing toDate
      return {
        ...res,
        current: newCurrent,
        toDate: newCurrent ? '' : res.toDate
      };
    }
    return res;
  }));
};
```

**Important:** The first form (and all forms) remain editable because:
- All forms use the same `updateResidence` function
- No conditional logic disables editing based on form index
- The `autoAdded` flag only affects automatic removal, not editability

---

## 4. How History Entry Forms are Removed When Editing Results in 7+ Years Total

**Location:** `server/backups/format-backup-2025-11-07T16-32-11-435Z/Onb3.js` (lines 380-424, 450-466)

### A. Automatic Removal When Coverage is Complete

```javascript
// If coverage is complete, remove all auto-added residences
if (isComplete && autoAdded.length > 0) {
  setResidences(manuallyAdded);
  return;
}
```

### B. Removal of Excess Auto-Added Forms

```javascript
// If we have too many auto-added residences, remove excess
else if (autoAdded.length > entriesNeeded) {
  const toKeep = autoAdded.slice(0, entriesNeeded);
  setResidences([...manuallyAdded, ...toKeep]);
}
```

### C. Removal When No Longer Needed

```javascript
// If we have auto-added residences but they're no longer needed
else if (remainingYears <= 0.5 && autoAdded.length > 0) {
  setResidences(manuallyAdded);
}
```

### D. Alternative Auto-Remove Logic (from useEffect)

**Location:** `server/backups/format-backup-2025-11-07T16-32-11-435Z/Onb3.js` (lines 429-466)

```javascript
// Recalculate residential years whenever addresses change
useEffect(() => {
  const years = calculateResidentialYears(residences);
  setResidentialYears(parseFloat(years));
  
  // Check if all current addresses are filled
  const allFilled = residences.every(addr => 
    addr.street && addr.city && addr.state && addr.zip && addr.fromDate
  );
  
  // AUTO-ADD: If under 7 years and all addresses are filled
  if (parseFloat(years) < REQUIRED_RESIDENTIAL_YEARS && allFilled && residences.length > 0) {
    const lastAddress = residences[residences.length - 1];
    if (lastAddress && !lastAddress.current) {
      // Don't auto-add more than 10 addresses
      if (residences.length < 10) {
        addResidence();
      }
    }
  }
  
  // AUTO-REMOVE: If 7+ years reached, remove empty auto-added addresses
  if (parseFloat(years) >= REQUIRED_RESIDENTIAL_YEARS && residences.length > 1) {
    // Find empty addresses (likely auto-added)
    const emptyAddresses = residences.filter(addr => 
      !addr.street && !addr.city && !addr.state && !addr.zip && !addr.fromDate
    );
    
    // Remove empty addresses, but keep at least 1 address
    if (emptyAddresses.length > 0 && residences.length - emptyAddresses.length >= 1) {
      setResidences(prev => 
        prev.filter(addr => 
          addr.street || addr.city || addr.state || addr.zip || addr.fromDate
        )
      );
    }
  }
}, [residences]);
```

**Key Removal Logic:**
1. **When totalYears >= 7:** All auto-added forms are removed
2. **When remainingYears <= 0.5:** All auto-added forms are removed
3. **Empty forms:** Any form with no data is removed (if 7+ years is reached)
4. **Preservation:** Manually-added forms are NEVER automatically removed

---

## Additional Supporting Code

### Remove Residence Function

**Location:** `client/src/app/js/Onb3.js` (lines 68-70)

```javascript
const removeResidence = (id) => {
  setResidences(residences.filter(res => res.id !== id));
};
```

### Form Rendering (shows Remove button)

**Location:** `client/src/app/js/Onb3.js` (lines 383-391)

```javascript
{residences.map((res, index) => (
  <div key={res.id} style={styles.collectionItem}>
    <div style={styles.collectionHeader}>
      <span style={styles.collectionTitle}>Address #{index + 1}</span>
      {residences.length > 1 && (
        <button type="button" onClick={() => removeResidence(res.id)} style={styles.removeBtn}>
          Remove
        </button>
      )}
    </div>
    {/* ... form fields ... */}
  </div>
))}
```

### Schema Definition

**Location:** `client/src/schemas/step-3-comprehensive.json` (lines 120-172)

The schema defines the residential history collection with:
- `minItems: 1` - At least one address is required
- Fields: streetAddress, city, state, postalCode, county, country, fromDate, residentialEndDate
- Special field type: `residentialEndDate` (handles "Current" checkbox)

---

## Summary

1. **Time Calculation:** Uses days difference divided by 365.25 (accounts for leap years), rounded to 2 decimal places
2. **Additional Forms:** Auto-added when `remainingYears > 0.5`, calculated as `Math.ceil(remainingYears / 3)` (max 4)
3. **Editability:** All forms remain editable - no code disables the first form
4. **Removal:** Auto-added forms are removed when `totalYears >= 7` or `remainingYears <= 0.5`; manually-added forms are never auto-removed


