import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { BACKEND_URL } from '../config';

export default function Download() {
  const router = useRouter();
  const { code } = router.query;
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  useEffect(() => {
    if (!code) return;

    const fetchTransfer = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/transfer/${code}`);
        
        if (response.ok) {
          const data = await response.json();
          setTransfer(data);
          setError('');
        } else if (response.status === 404) {
          setError('Invalid code. Please check and try again.');
        } else if (response.status === 410) {
          setError('This transfer has expired. Files have been deleted.');
        } else {
          setError('An error occurred. Please try again.');
        }
      } catch (err) {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfer();
  }, [code]);

  useEffect(() => {
    if (!transfer) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = transfer.expiresAt - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        setError('This transfer has expired. Files have been deleted.');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [transfer]);

  const handleDownload = (fileId, fileName) => {
    const url = `${BACKEND_URL}/api/download/${code}/${fileId}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = () => {
    const url = `${BACKEND_URL}/api/download-all/${code}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `transfer-${code}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p style={{ textAlign: 'center' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Error - File Transfer</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className="container">
          <Link href="/receive" className="back-link">
            ← Try Another Code
          </Link>

          <div className="card">
            <h1 className="title">Error</h1>
            <div className="error-message">{error}</div>

            <button
              className="btn"
              onClick={() => router.push('/receive')}
              style={{ marginTop: '1rem' }}
            >
              Try Another Code
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Download Files - File Transfer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <Link href="/receive" className="back-link">
          ← Try Another Code
        </Link>

        <div className="card">
          <h1 className="title">Download Files</h1>
          <p className="subtitle">Code: {code}</p>

          {timeLeft && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="countdown">{timeLeft}</div>
              <p style={{ fontSize: '0.9rem', color: '#888' }}>
                Time remaining
              </p>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            {transfer?.files?.map((file) => (
              <div key={file.id} className="download-item">
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatFileSize(file.size)}</div>
                </div>
                <button
                  className="download-btn"
                  onClick={() => handleDownload(file.id, file.name)}
                >
                  Download
                </button>
              </div>
            ))}
          </div>

          {transfer?.files?.length > 1 && (
            <button
              className="btn"
              onClick={handleDownloadAll}
            >
              Download All as ZIP
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => router.push('/')}
          >
            Upload Files
          </button>
        </div>
      </div>
    </>
  );
}
