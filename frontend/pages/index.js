import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { BACKEND_URL } from '../config';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const MAX_FILES = 10;
  const MAX_SIZE = 200 * 1024 * 1024; // 200MB

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    if (files.length + fileArray.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const totalSize = [...files, ...fileArray].reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_SIZE) {
      setError('Total file size exceeds 200MB limit');
      return;
    }

    setError('');
    setFiles([...files, ...fileArray]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setError('');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          router.push(`/success?code=${response.code}&expiresAt=${response.expiresAt}`);
        } else {
          const error = JSON.parse(xhr.responseText);
          setError(error.error || 'Upload failed');
          setUploading(false);
        }
      });

      xhr.addEventListener('error', () => {
        setError('Upload failed. Please try again.');
        setUploading(false);
      });

      xhr.open('POST', `${BACKEND_URL}/api/upload`);
      xhr.send(formData);
    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <>
      <Head>
        <title>File Transfer - Share Files Securely</title>
        <meta name="description" content="Temporary file sharing service" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <div className="card">
          <h1 className="title">File Transfer</h1>
          <p className="subtitle">Share files securely with a temporary code</p>

          <div
            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              Drag & drop files here or click to select
            </p>
            <p className="upload-hint">
              Max {MAX_FILES} files, 200MB total
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="file-input"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#888' }}>
                Total: {files.length} file{files.length !== 1 ? 's' : ''} ({formatFileSize(totalSize)})
              </div>
            </div>
          )}

          {uploading && (
            <div className="progress-container">
              <div className="progress-text">
                Uploading... {uploadProgress}%
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          <button
            className="btn"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => router.push('/receive')}
          >
            Receive Files
          </button>
        </div>
      </div>
    </>
  );
}
