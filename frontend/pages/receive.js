import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { BACKEND_URL } from '../config';

export default function Receive() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/transfer/${code}`);
      
      if (response.ok) {
        router.push(`/download?code=${code}`);
      } else if (response.status === 404) {
        setError('Invalid code. Please check and try again.');
      } else if (response.status === 410) {
        setError('This transfer has expired. Files have been deleted.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  return (
    <>
      <Head>
        <title>Receive Files - File Transfer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <Link href="/" className="back-link">
          ← Back to Upload
        </Link>

        <div className="card">
          <h1 className="title">Receive Files</h1>
          <p className="subtitle">Enter the 6-digit code to access files</p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="code-input"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              autoFocus
            />

            {error && (
              <div className="error-message">{error}</div>
            )}

            <button
              type="submit"
              className="btn"
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Checking...' : 'Access Files'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
