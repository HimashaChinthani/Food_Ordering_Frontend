import React, { useState } from 'react';
import './QuantityModal.css';

const QuantityModal = ({ open, onClose, onConfirm, initial = 1, max = 99 }) => {
  const [qty, setQty] = useState(initial);

  if (!open) return null;

  const confirm = () => {
    const n = Math.max(1, Math.min(max, parseInt(qty) || 1));
    onConfirm(n);
  };

  return (
    <div className="qm-overlay">
      <div className="qm-modal">
        <h3>How many would you like?</h3>
        <div className="qm-body">
          <input
            type="number"
            min="1"
            max={max}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="qm-input"
          />
        </div>
        <div className="qm-actions">
          <button className="qm-btn qm-confirm" onClick={confirm}>Add</button>
          <button className="qm-btn qm-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default QuantityModal;
