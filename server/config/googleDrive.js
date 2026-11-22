import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load both root .env and local server/.env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

/**
 * Initialize Google Drive API v3 client with flexible authentication:
 * 1. Service Account JSON file (via GOOGLE_APPLICATION_CREDENTIALS)
 * 2. Service Account Env Vars (GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY)
 * 3. API Key (via GOOGLE_DRIVE_API_KEY) - simplest for public shared folders
 */
export function initializeGoogleDrive() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const saPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // 1. Service Account JSON file path
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    return google.drive({ version: 'v3', auth });
  }

  // 2. Service Account direct environment credentials
  if (saEmail && saPrivateKey && !saEmail.includes('your-project')) {
    const formattedKey = saPrivateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: saEmail,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    return google.drive({ version: 'v3', auth });
  }

  // 3. API Key (simplest setup for folders shared as "Anyone with the link can view")
  if (apiKey && apiKey !== 'your_google_cloud_api_key_here') {
    return google.drive({ version: 'v3', auth: apiKey });
  }

  // Fallback: Unauthenticated client (will log warning if called)
  console.warn(
    '[Google Drive] Warning: No valid Google Drive API Key or Service Account credentials found in environment. Drive API calls will fail until credentials are configured in server/.env.'
  );
  return google.drive({ version: 'v3' });
}

export const driveClient = initializeGoogleDrive();
export default driveClient;
