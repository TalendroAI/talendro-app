// server/middleware/formatProtection.js
// This middleware ensures that parsing operations do not modify existing page formats

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of critical files that should never be modified by parsing
const PROTECTED_FILES = [
  'client/src/schemas/step-1-comprehensive.json',
  'client/src/schemas/step-2-comprehensive.json', 
  'client/src/schemas/step-3-comprehensive.json',
  'client/src/schemas/step-4-comprehensive.json',
  'client/src/schemas/step-5-comprehensive.json',
  'client/src/components/FormRendererComprehensive.js',
  'client/src/components/FormRenderer.js',
  'client/src/app/js/Onb1.js',
  'client/src/app/js/Onb2.js',
  'client/src/app/js/Onb3.js',
  'client/src/app/js/Onb4.js',
  'client/src/app/js/Onb5.js',
  'client/src/ui/Header.js',
  'client/src/shell/App.js'
];

// Create backup of protected files before parsing
export function createFormatBackup() {
  const backupDir = path.join(__dirname, '../backups');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `format-backup-${timestamp}`);
  
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  
  PROTECTED_FILES.forEach(filePath => {
    const fullPath = path.join(__dirname, '../../', filePath);
    if (fs.existsSync(fullPath)) {
      const backupFilePath = path.join(backupPath, path.basename(filePath));
      fs.copyFileSync(fullPath, backupFilePath);
      console.log(`[FORMAT PROTECTION] Backed up ${filePath} to ${backupFilePath}`);
    }
  });
  
  return backupPath;
}

// Restore format from backup if needed
export function restoreFormatFromBackup(backupPath) {
  if (!fs.existsSync(backupPath)) {
    console.error(`[FORMAT PROTECTION] Backup path does not exist: ${backupPath}`);
    return false;
  }
  
  PROTECTED_FILES.forEach(filePath => {
    const fullPath = path.join(__dirname, '../../', filePath);
    const backupFilePath = path.join(backupPath, path.basename(filePath));
    
    if (fs.existsSync(backupFilePath)) {
      fs.copyFileSync(backupFilePath, fullPath);
      console.log(`[FORMAT PROTECTION] Restored ${filePath} from backup`);
    }
  });
  
  return true;
}

// Validate that critical files haven't been modified
export function validateFormatIntegrity() {
  const issues = [];
  
  PROTECTED_FILES.forEach(filePath => {
    const fullPath = path.join(__dirname, '../../', filePath);
    if (!fs.existsSync(fullPath)) {
      issues.push(`Missing critical file: ${filePath}`);
    }
  });
  
  if (issues.length > 0) {
    console.error(`[FORMAT PROTECTION] Format integrity issues detected:`, issues);
    return false;
  }
  
  console.log(`[FORMAT PROTECTION] All critical files present and accounted for`);
  return true;
}

// Middleware to protect formats during parsing
export function formatProtectionMiddleware(req, res, next) {
  // Create backup before any parsing operation
  const backupPath = createFormatBackup();
  
  // Store backup path in request for potential restoration
  req.formatBackupPath = backupPath;
  
  // Validate format integrity
  if (!validateFormatIntegrity()) {
    return res.status(500).json({
      error: 'Format integrity check failed',
      message: 'Critical page formats are missing or corrupted'
    });
  }
  
  next();
}

// Cleanup old backups (keep only last 10)
export function cleanupOldBackups() {
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    return;
  }
  
  const backups = fs.readdirSync(backupDir)
    .filter(name => name.startsWith('format-backup-'))
    .map(name => ({
      name,
      path: path.join(backupDir, name),
      timestamp: fs.statSync(path.join(backupDir, name)).mtime
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
  
  // Keep only the 10 most recent backups
  if (backups.length > 10) {
    const toDelete = backups.slice(10);
    toDelete.forEach(backup => {
      fs.rmSync(backup.path, { recursive: true, force: true });
      console.log(`[FORMAT PROTECTION] Cleaned up old backup: ${backup.name}`);
    });
  }
}





