import React from 'react';

const ShipmentSummary = ({ formData, totals, currentStep, onBackClick }) => {
  // 货物数量
  const itemCount = formData.cargoItems?.length || 0;
  
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
            <label>起点</label>
            <div>{formData.origin || '-'}</div>
          </div>
          <div className="summary-item">
            <label>终点</label>
            <div>{formData.destination || '-'}</div>
          </div>
          <div className="summary-item highlight">
            <label>总重量</label>
            <div>{parseFloat(totals.totalWeight).toLocaleString()} lbs</div>
          </div>
          <div className="summary-item">
            <label>货运分类</label>
            <div>Class {totals.freightClass || '-'}</div>
          </div>
          <div className="summary-item highlight">
            <label>托盘总数</label>
            <div>{totals.totalPallets} 托盘</div>
          </div>
          <div className="summary-item">
            <label>线性英尺</label>
            <div>{totals.totalLinearFeet} ft</div>
          </div>
          {totals.totalCubicFeet && (
            <div className="summary-item">
              <label>体积</label>
              <div>{totals.totalCubicFeet} cu.ft</div>
            </div>
          )}
          <div className="summary-item">
            <label>货物种类</label>
            <div>{itemCount} 种</div>
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






