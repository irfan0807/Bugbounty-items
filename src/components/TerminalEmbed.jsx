import React, { useState, useEffect } from 'react';

const TERMINAL_URL = 'http://127.0.0.1:7681';

function detectClientOS() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  return 'Unknown';
}

const SETUP_COMMANDS = {
  Windows: 'winget install tsl0922.ttyd; ttyd -W -p 7681 powershell.exe',
  macOS: 'brew install ttyd && ttyd -W -p 7681 zsh',
  Linux: 'sudo apt install -y ttyd && ttyd -W -p 7681 bash',
  Unknown: 'ttyd -W -p 7681 bash',
};

export default function TerminalEmbed() {
  const [os] = useState(detectClientOS);
  const [connected, setConnected] = useState(true); // Optimistic zero-latency load
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    const pingTerminal = async () => {
      try {
        await fetch(TERMINAL_URL, { mode: 'no-cors', cache: 'no-store' });
        if (active) setConnected(true);
      } catch {
        if (active) setConnected(false);
      }
    };

    pingTerminal();
    const interval = setInterval(pingTerminal, 1500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const copyCommand = () => {
    navigator.clipboard.writeText(SETUP_COMMANDS[os]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!connected) {
    return (
      <div style={{ padding: '24px', background: '#111', color: '#eee', borderRadius: '8px', fontFamily: 'monospace' }}>
        <h3>Host Terminal Disconnected ({os} Detected)</h3>
        <p>Run this single command in your {os} terminal to connect immediately:</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#222', padding: '12px', borderRadius: '6px' }}>
          <code style={{ flex: 1, color: '#4ade80' }}>{SETUP_COMMANDS[os]}</code>
          <button onClick={copyCommand} style={{ padding: '6px 12px', cursor: 'pointer' }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#888', marginTop: '12px' }}>
          Waiting for local bridge on {TERMINAL_URL}... (auto-connects with zero latency once started)
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={TERMINAL_URL}
      title="Host Terminal"
      style={{ width: '100%', height: '100%', minHeight: '500px', border: 'none', borderRadius: '8px' }}
    />
  );
}
