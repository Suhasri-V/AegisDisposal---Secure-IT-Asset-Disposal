/**
 * AegisDisposal — Admin Password Hash Generator
 * ─────────────────────────────────────────────
 * Usage:  npx tsx scripts/gen_admin_hash.ts
 *
 * Prompts for a password and prints the ADMIN_PASSWORD_HASH value to paste
 * into your .env file. The plaintext password is never stored or logged.
 *
 * Requirements: password must be ≥12 chars, with uppercase, lowercase, digit, symbol.
 */

import bcrypt from 'bcryptjs';
import readline from 'readline';

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

const password = await ask('Enter new admin password (will be visible): ');

if (
  password.length < 12 ||
  !/[A-Z]/.test(password) ||
  !/[a-z]/.test(password) ||
  !/\d/.test(password) ||
  !/[^A-Za-z0-9]/.test(password)
) {
  console.error('\nPassword must be at least 12 characters with uppercase, lowercase, digit, and symbol.');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log('\nCopy the line below into your .env file:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('\nThen restart the server: npm run dev');
