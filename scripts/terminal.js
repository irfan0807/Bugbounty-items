
import { spawn, spawnSync } from 'child_process';
import net from 'net';
import os from 'os';

const PORT = 7681;
const HOST = '127.0.0.1';
const platform = os.platform();

let terminalProcess = null;

function isPortOpen() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let finished = false;

    const done = (result) => {
      if (finished) return;
      finished = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(500);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));

    socket.connect(PORT, HOST);
  });
}

function hasTtyd() {
  const command = platform === 'win32'
    ? 'where.exe'
    : 'which';

  return spawnSync(command, ['ttyd'], {
    encoding: 'utf8',
    windowsHide: true
  }).status === 0;
}

function installTtyd() {
  console.log(`[Terminal] Installing ttyd on ${platform}`);

  let result;

  if (platform === 'win32') {
    result = spawnSync('winget', [
      'install',
      '--id', 'tsl0922.ttyd',
      '-e',
      '--silent',
      '--accept-package-agreements',
      '--accept-source-agreements'
    ], { stdio: 'inherit', windowsHide: true });

  } else if (platform === 'darwin') {
    result = spawnSync('brew', ['install', 'ttyd'], {
      stdio: 'inherit'
    });

  } else if (platform === 'linux') {
    result = spawnSync('sudo', [
      'apt-get', 'install', '-y', 'ttyd'
    ], { stdio: 'inherit' });

  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  if (result.status !== 0) {
    throw new Error('ttyd installation failed');
  }
}

async function waitForTerminal(timeout = 15000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await isPortOpen()) {
      console.log(`[Terminal] Ready at http://${HOST}:${PORT}`);
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error('Terminal startup timed out');
}

async function bootTerminal() {
  // Reuse an existing terminal.
  if (await isPortOpen()) {
    console.log('[Terminal] Already running');
    return;
  }

  if (!hasTtyd()) {
    installTtyd();
  }

  const shell = platform === 'win32'
    ? 'powershell.exe'
    : platform === 'darwin'
      ? 'zsh'
      : 'bash';

  console.log('[Terminal] Starting ttyd...');

  terminalProcess = spawn(
    'ttyd',
    [
      '-i', HOST,
      '-W',
      '-p', String(PORT),
      shell
    ],
    {
      stdio: 'ignore',
      windowsHide: true
    }
  );

  terminalProcess.on('error', (error) => {
    console.error('[Terminal] Process error:', error);
    terminalProcess = null;
  });

  terminalProcess.on('exit', (code) => {
    console.log('[Terminal] Exited:', code);
    terminalProcess = null;
  });

  await waitForTerminal();
}

bootTerminal().catch(error => {
  console.error('[Terminal] Boot failed:', error);
});
