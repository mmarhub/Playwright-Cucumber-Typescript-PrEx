// env-utils.ts
import * as fs from 'fs';
import * as path from 'path';

// Find the .env file in your project root
const ENV_PATH = path.resolve(__dirname, '../../.env');

/**
 * Add or update a key=value in the .env file.
 * If the key exists, overwrite it.
 * If not, add it at the end.
 */
export async function setEnvValue(key: string, value: string): Promise<void> {
  try {
    // Read current .env content (if file exists)
    let content = '';
    if (fs.existsSync(ENV_PATH)) {
      content = fs.readFileSync(ENV_PATH, 'utf8');
    }

    const lines = content.split('\n').filter(line => line.trim() !== '');
    const existingIndex = lines.findIndex(line => line.startsWith(`${key}=`));

    // Replace or add new line
    if (existingIndex !== -1) {
      lines[existingIndex] = `${key}=${value}`;
    } else {
      lines.push(`${key}=${value}`);
    }

    // Write the updated content back to the file
    fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf8');
    console.log(`✅ Updated .env: ${key}=${value}`);
  } catch (err) {
    console.error(`❌ Failed to update .env:`, err);
  }
}
