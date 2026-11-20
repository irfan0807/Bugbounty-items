import { useState } from 'react';

const CHATGPT_URL = import.meta.env.VITE_SKYNET_CHATGPT_URL || 'https://chatgpt.com/';

export default function ContextualTutor({ subject, context }) {
  const [copied, setCopied] = useState(false);
  const prompt = `Teach me this cybersecurity topic clearly and stay focused on it.\n\nTOPIC: ${subject}\n\nAPP CONTEXT:\n${context}\n\nPlease explain the underlying mechanism, a realistic but harmless example, how to recognize the violated security property, and a defensive fix. If code helps, give a complete small example in the relevant language and explain it line by line. Keep exercises local, synthetic, and authorized. Do not provide instructions for attacking real systems, stealing data, persistence, or evading detection. State assumptions and distinguish evidence from speculation.`;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <details className="skynet-tutor">
      <summary><span>Ask ChatGPT to explain this</span><b>↗</b></summary>
      <div className="skynet-tutor-body">
        <p>Open ChatGPT with this item’s context. Copy the prompt, then paste it into your chat; SkyNet does not send lesson data automatically.</p>
        <label className="sr-only" htmlFor={`chatgpt-prompt-${subject.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}>Contextual ChatGPT prompt</label>
        <textarea id={`chatgpt-prompt-${subject.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`} readOnly value={prompt} rows={6} onFocus={(event) => event.target.select()} />
        <div className="skynet-tutor-actions">
          <button type="button" onClick={copyPrompt}>{copied ? 'Prompt copied' : 'Copy prompt'}</button>
          <a href={CHATGPT_URL} target="_blank" rel="noreferrer">Open ChatGPT ↗</a>
        </div>
      </div>
    </details>
  );
}
