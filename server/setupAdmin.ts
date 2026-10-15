import bcrypt from 'bcryptjs';
import readline from 'readline';

function readHiddenPassword(): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('Run this setup command in an interactive terminal so the password can be hidden.');
  }

  readline.emitKeypressEvents(input);
  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  process.stdout.write('Enter a strong Admin password (input hidden): ');

  return new Promise((resolve, reject) => {
    let password = '';
    const cleanup = () => {
      input.off('keypress', onKeypress);
      input.setRawMode(wasRaw);
      process.stdout.write('\n');
    };
    const onKeypress = (character: string, key: readline.Key) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('Admin password setup cancelled.'));
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        resolve(password);
        return;
      }
      if (key.name === 'backspace') {
        password = password.slice(0, -1);
        return;
      }
      if (character && !key.ctrl && !key.meta) password += character;
    };

    input.on('keypress', onKeypress);
  });
}

const password = await readHiddenPassword();
if (
  password.length < 12 ||
  !/[A-Z]/.test(password) ||
  !/[a-z]/.test(password) ||
  !/\d/.test(password) ||
  !/[^A-Za-z0-9]/.test(password)
) {
  throw new Error('Use at least 12 characters with uppercase, lowercase, number, and symbol characters.');
}

console.log(`ADMIN_PASSWORD_HASH=${await bcrypt.hash(password, 12)}`);
