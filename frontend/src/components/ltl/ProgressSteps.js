import React from 'react';

const ProgressSteps = ({ currentStep }) => {
  return (
    <div className="progress-steps">
      <div className={`step ${currentStep >= 1 ? 'completed' : ''}`}>
        <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
        <div className="step-label">填写报价</div>
      </div>
      <div className={`step-line ${currentStep > 1 ? 'completed' : ''}`}></div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
        <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
        <div className="step-label">承运商选择</div>
      </div>
      <div className={`step-line ${currentStep > 2 ? 'completed' : ''}`}></div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-circle">3</div>
        <div className="step-label">发货详情</div>
      </div>
    </div>
  );
};

export default ProgressSteps;






