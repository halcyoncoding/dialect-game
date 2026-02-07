import { useState, useCallback, useEffect } from 'react';

// ──────────────────── COMPONENT ──────────────────────────────────

/**
 * Displays the server join URL and provides a one-click copy button.
 * Fetches the network info from the server's /api/network-info endpoint.
 */
const JoinLink = () => {
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Fetch network info on mount
  useEffect(() => {
    fetch('/api/network-info')
      .then((res) => res.json())
      .then((data: { url: string }) => setJoinUrl(data.url))
      .catch(() => setJoinUrl(window.location.origin));
  }, []);

  /** Copies the join URL to the clipboard with visual feedback. */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a hidden input
      const input = document.createElement('input');
      input.value = joinUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [joinUrl]);

  return (
    <div className="space-y-2">
      <p className="text-storm-500 text-xs font-body">Share this link with players:</p>

      <div className="flex items-center gap-2">
        <code className="flex-1 bg-storm-700 text-storm-200 px-3 py-2 rounded text-sm font-mono truncate">
          {joinUrl || 'Loading...'}
        </code>
        <button
          onClick={handleCopy}
          disabled={!joinUrl}
          className={`px-4 py-2 rounded text-sm font-body transition-colors
                     focus:outline-none focus:ring-2
                     ${copied
                       ? 'bg-spruce text-white focus:ring-spruce/50'
                       : 'bg-orange text-storm-900 hover:bg-orange/90 focus:ring-orange/50'
                     }
                     disabled:opacity-50`}
          tabIndex={0}
          aria-label={copied ? 'Link copied' : 'Copy join link'}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export default JoinLink;
