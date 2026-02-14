import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Success() {
  const router = useRouter();
  const { code, expiresAt } = router.query;
  const [timeLeft, setTimeLeft] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = parseInt(expiresAt);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const copyToClipboard = async () => {
    if (!code) return;
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!code) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Upload Successful - File Transfer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <div className="success-icon">✓</div>
            <h1 className="title">Upload Successful!</h1>
            <p className="subtitle">Share this code with the recipient</p>
          </div>

          <div className="code-display">
            <div className="code-label">Transfer Code</div>
            <div className="code-value">{code}</div>
            <button className="btn" onClick={copyToClipboard}>
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>

          {timeLeft && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div className="countdown">{timeLeft}</div>
                <p className="warning-text">
                  Files will be permanently deleted in 10 minutes
                </p>
              </div>
            </>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link href="/" className="back-link">
              ← Upload More Files
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
