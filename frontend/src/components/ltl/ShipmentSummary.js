import React from 'react';

const ShipmentSummary = ({ formData, totals, currentStep, onBackClick }) => {
  const originShort = (formData.origin || '-').split(',').slice(0, 2).join(',').trim();
  const destShort = (formData.destination || '-').split(',').slice(0, 2).join(',').trim();

  return (
    <div className="shipment-summary shipment-summary-compact">
      <div className="summary-compact-row">
        <div className="summary-route">
          <span className="route-label">FROM</span>
          <span className="route-value">{originShort}</span>
          <span className="route-arrow">→</span>
          <span className="route-label">TO</span>
          <span className="route-value">{destShort}</span>
        </div>

        <div className="summary-stats">
          <span className="stat"><strong>{totals.totalPallets}</strong> PLT</span>
          <span className="stat-sep">|</span>
          <span className="stat"><strong>{parseFloat(totals.totalWeight).toLocaleString()}</strong> lbs</span>
          <span className="stat-sep">|</span>
          <span className="stat">Class <strong>{totals.freightClass || '-'}</strong></span>
          <span className="stat-sep">|</span>
          <span className="stat"><strong>{totals.totalCubicFeet}</strong> cu.ft</span>
        </div>

        {currentStep === 2 && onBackClick && (
          <button className="summary-back-btn" onClick={onBackClick}>← 修改</button>
        )}
      </div>
    </div>
  );
};

export default ShipmentSummary;






