import React from 'react';

const ShipmentSummary = ({ formData, totals, currentStep, onBackClick }) => {
  return (
    <div className="shipment-summary">
      <h2>SHIPMENT SUMMARY</h2>
      <div className="summary-content">
        <div className="summary-row">
          <div className="summary-item">
            <label>Quote ID</label>
            <div>LTL-{Date.now().toString().slice(-6)}</div>
          </div>
          <div className="summary-item">
            <label>Pickup</label>
            <div>{formData.origin}</div>
          </div>
          <div className="summary-item">
            <label>Delivery</label>
            <div>{formData.destination}</div>
          </div>
          <div className="summary-item">
            <label>Total Weight</label>
            <div>{totals.totalWeight} lbs</div>
          </div>
          <div className="summary-item">
            <label>Class</label>
            <div>{totals.freightClass}</div>
          </div>
          <div className="summary-item">
            <label>Total Qty</label>
            <div>{totals.totalPallets}</div>
          </div>
          <div className="summary-item">
            <label>Total Linear Feet</label>
            <div>{totals.totalLinearFeet}</div>
          </div>
        </div>
      </div>
      
      {currentStep === 2 && onBackClick && (
        <div className="summary-actions">
          <button className="btn-secondary" onClick={onBackClick}>
            ← 返回修改
          </button>
        </div>
      )}
    </div>
  );
};

export default ShipmentSummary;

