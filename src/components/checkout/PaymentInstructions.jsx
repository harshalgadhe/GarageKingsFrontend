import React, { useState } from 'react';

export default function PaymentInstructions({ upiId, upiQrImage, price }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId || 'garagekings@upi');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finalUpiId = upiId || 'garagekings@upi';
  const qrUrl = upiQrImage || '/upi-qr.png';

  return (
    <div className="bg-[#141414] border border-white/5 rounded-xl p-5 space-y-4">
      <div className="text-center">
        <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">
          Amount to Pay
        </p>
        <h3 className="text-2xl font-black text-white mt-1 font-mono">
          ₹{Number(price).toLocaleString('en-IN')}
        </h3>
      </div>

      <div className="border-t border-white/5 pt-4 flex flex-col items-center space-y-3">
        <div className="bg-white p-3 rounded-xl shadow-inner w-36 h-36 flex items-center justify-center">
          {/* Fallback simple text or qr icon if image fails */}
          <img 
            src={qrUrl} 
            alt="UPI QR Code" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `<span class="text-black font-extrabold text-xs text-center uppercase tracking-tighter">Scan QR<br/>to Pay</span>`;
            }}
          />
        </div>
        <p className="text-[9px] text-[#666666] uppercase tracking-wider text-center">
          Scan with GPay, PhonePe, Paytm, or BHIM
        </p>
      </div>

      <div className="bg-[#1c1c1c] border border-white/5 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
        <div className="overflow-hidden">
          <p className="text-[9px] font-bold text-[#888888] uppercase tracking-wider">
            UPI Address
          </p>
          <p className="text-xs text-white font-mono truncate select-all mt-0.5">
            {finalUpiId}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-bold text-[10px] px-3 py-1.5 rounded-md uppercase tracking-wider transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="text-[10px] text-[#888888] leading-relaxed bg-[#ff5500]/5 border border-[#ff5500]/10 rounded-lg p-3">
        <span className="text-[#ff5500] font-bold">IMPORTANT:</span> Transfer exactly <span className="font-mono text-white font-bold">₹{Number(price).toLocaleString('en-IN')}</span> and upload the payment screenshot below to finalize confirmation.
      </div>
    </div>
  );
}
