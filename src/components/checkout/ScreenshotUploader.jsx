import React, { useState, useRef } from 'react';
import { useLoading } from '../../providers/LoadingProvider';

export default function ScreenshotUploader({ orderId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { showLoader, hideLoader } = useLoading();

  const API_BASE_URL = import.meta.env.PROD 
    ? '/api/v1' 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

  const handleFileChange = (e) => {
    setError('');
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Only image files (JPEG, PNG, WEBP) are allowed.');
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a payment screenshot first.');
      return;
    }

    setUploading(true);
    showLoader('Uploading payment receipt...');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/screenshot`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMsg = 'Upload failed. Please check your image.';
        try {
          const data = await response.json();
          errorMsg = data.message || errorMsg;
        } catch (e) {
          try {
            const text = await response.text();
            if (text) errorMsg = text;
          } catch (_) {}
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      hideLoader();
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      hideLoader();
      setError(err.message || 'Error uploading receipt.');
    } finally {
      setUploading(false);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="text-left">
        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block mb-2">
          Upload Payment Screenshot
        </label>
        
        <div 
          onClick={triggerInput}
          className="border-2 border-dashed border-white/5 hover:border-[#ff5500]/30 bg-[#141414] rounded-xl p-6 text-center cursor-pointer transition-colors relative overflow-hidden group min-h-[120px] flex flex-col justify-center items-center"
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden" 
          />

          {previewUrl ? (
            <div className="absolute inset-0 bg-[#090909]">
              <img 
                src={previewUrl} 
                alt="Receipt Preview" 
                className="w-full h-full object-contain p-2"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs font-extrabold uppercase tracking-wider bg-[#ff5500] px-3 py-1.5 rounded-lg shadow-lg">
                  Change Image
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-2xl text-[#ff5500]/60 group-hover:text-[#ff5500] transition-colors">
                ↑
              </div>
              <p className="text-xs text-white font-bold uppercase tracking-wider">
                Click to Browse
              </p>
              <p className="text-[9px] text-[#666666] uppercase tracking-widest">
                PNG, JPG, or WEBP up to 5MB
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-medium tracking-wide uppercase">
          Error: {error}
        </div>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-white hover:bg-white/95 active:bg-white/90 disabled:bg-white/50 text-black font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all uppercase tracking-wider shadow-lg"
        >
          {uploading ? 'Uploading Receipt...' : 'Confirm Payment'}
        </button>
      )}
    </div>
  );
}
