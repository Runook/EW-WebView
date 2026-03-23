import React, { useState, useEffect } from 'react';
import { Coins, Star, Zap, AlertCircle, CheckCircle, CreditCard, ArrowLeft, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../utils/apiClient';
import './PremiumPostStep.css';

/**
 * Inline premium/credits step — NOT a modal overlay.
 * Renders as a normal block inside the post page.
 *
 * Props:
 *   postType   — 'job' | 'resume' | 'rental' | 'sale' | 'company'
 *   formData   — saved form payload from step 1
 *   onConfirm  — async ({ formData, premium }) => void
 *   onBack     — () => void   (return to form step)
 *   loading    — external loading flag (optional)
 */
const PremiumPostStep = ({ postType, formData, onConfirm, onBack, loading: externalLoading }) => {
  const [systemConfig, setSystemConfig] = useState({});
  const [userCredits, setUserCredits] = useState(null);
  const [configError, setConfigError] = useState(false);
  const [selectedPremium, setSelectedPremium] = useState(null); // null | 'top' | 'highlight'
  const [premiumDuration, setPremiumDuration] = useState(24);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSystemConfig();
    fetchUserCredits();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const data = await apiClient.get('/user-management/system-config');
      if (data.success) {
        setSystemConfig(data.data);
      } else {
        setConfigError(true);
      }
    } catch {
      setConfigError(true);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const data = await apiClient.get('/user-management/credits');
      if (data.success) setUserCredits(data.data);
    } catch { /* handled in UI */ }
  };

  const getPostCost = () => systemConfig[`post_costs.${postType}`] || 0;

  const getPremiumCost = () => {
    if (!selectedPremium) return 0;
    if (selectedPremium === 'top') return systemConfig[`premium_costs.top_${premiumDuration}h`] || 0;
    if (selectedPremium === 'highlight') return systemConfig['premium_costs.highlight'] || 0;
    return 0;
  };

  const totalCost = getPostCost() + getPremiumCost();
  const currentBalance = userCredits?.current ?? null;
  const enoughCredits = currentBalance !== null && currentBalance >= totalCost;
  const isLoading = submitting || externalLoading;

  const POST_TYPE_NAMES = {
    load: '货源信息', truck: '车源信息', company: '企业信息',
    job: '职位信息', resume: '简历信息', rental: '物流出租信息', sale: '物流出售信息',
    article: '论坛文章'
  };

  const handleConfirm = async () => {
    if (!enoughCredits) return;
    setSubmitting(true);
    try {
      await onConfirm({
        formData,
        premium: selectedPremium ? {
          type: selectedPremium,
          duration: selectedPremium === 'top' ? premiumDuration : undefined
        } : null
      });
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const topDurations = [
    { hours: 24, label: '24小时', key: 'premium_costs.top_24h' },
    { hours: 72, label: '3天', key: 'premium_costs.top_72h' },
    { hours: 168, label: '7天', key: 'premium_costs.top_168h' }
  ];

  return (
    <div className="premium-step">
      <div className="premium-step-header">
        <button type="button" className="premium-step-back" onClick={onBack}>
          <ArrowLeft size={18} /> 返回修改
        </button>
        <h2>发布{POST_TYPE_NAMES[postType] || '信息'} — 积分与增值服务</h2>
      </div>

      {configError && (
        <div className="premium-step-error">
          <AlertCircle size={16} /> 积分配置加载失败，请刷新页面重试
        </div>
      )}

      {/* Balance */}
      <div className="premium-step-balance">
        <Coins size={20} />
        <span>当前积分余额：<strong>{currentBalance !== null ? currentBalance : '加载中...'}</strong></span>
        <Link to="/profile/credits" className="premium-step-manage">积分管理</Link>
      </div>

      {/* Base cost */}
      <div className="premium-step-section">
        <h3>基础发布费用</h3>
        <div className="premium-step-base-cost">
          <span>发布{POST_TYPE_NAMES[postType] || '信息'}</span>
          <span className="premium-step-cost-val">{getPostCost()} 积分</span>
        </div>
      </div>

      {/* Premium options — clear 3-way radio */}
      <div className="premium-step-section">
        <h3>增值服务（可选）</h3>
        <div className="premium-step-options">
          {/* Normal */}
          <label className={`premium-opt ${selectedPremium === null ? 'selected' : ''}`}>
            <input type="radio" name="premiumType" checked={selectedPremium === null} onChange={() => setSelectedPremium(null)} />
            <div className="premium-opt-body">
              <div className="premium-opt-title">普通发布</div>
              <div className="premium-opt-desc">不使用增值服务</div>
            </div>
            <div className="premium-opt-price free">免费</div>
          </label>

          {/* Top / Pin */}
          <label className={`premium-opt ${selectedPremium === 'top' ? 'selected' : ''}`}>
            <input type="radio" name="premiumType" checked={selectedPremium === 'top'} onChange={() => setSelectedPremium('top')} />
            <div className="premium-opt-icon"><Star size={18} /></div>
            <div className="premium-opt-body">
              <div className="premium-opt-title">置顶显示</div>
              <div className="premium-opt-desc">显示在列表最上方，获得更多关注</div>
              {selectedPremium === 'top' && (
                <div className="premium-duration-group">
                  {topDurations.map(d => (
                    <label key={d.hours} className={`dur-label ${premiumDuration === d.hours ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="topDuration"
                        value={d.hours}
                        checked={premiumDuration === d.hours}
                        onChange={() => setPremiumDuration(d.hours)}
                      />
                      {d.label}
                      <span className="dur-cost">{systemConfig[d.key] || 0}积分</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="premium-opt-price">{selectedPremium === 'top' ? getPremiumCost() : (systemConfig['premium_costs.top_24h'] || 0)} 积分</div>
          </label>

          {/* Highlight */}
          <label className={`premium-opt ${selectedPremium === 'highlight' ? 'selected' : ''}`}>
            <input type="radio" name="premiumType" checked={selectedPremium === 'highlight'} onChange={() => setSelectedPremium('highlight')} />
            <div className="premium-opt-icon"><Zap size={18} /></div>
            <div className="premium-opt-body">
              <div className="premium-opt-title">高亮显示</div>
              <div className="premium-opt-desc">特殊颜色突出显示，更容易被注意</div>
            </div>
            <div className="premium-opt-price">{systemConfig['premium_costs.highlight'] || 0} 积分</div>
          </label>
        </div>
      </div>

      {/* Cost summary */}
      <div className="premium-step-summary">
        <div className="summary-line">
          <span>基础发布费用</span><span>{getPostCost()} 积分</span>
        </div>
        {selectedPremium && (
          <div className="summary-line">
            <span>增值服务费用</span><span>{getPremiumCost()} 积分</span>
          </div>
        )}
        <div className="summary-total-line">
          <span>总计</span>
          <span className={enoughCredits || currentBalance === null ? 'total-ok' : 'total-bad'}>{totalCost} 积分</span>
        </div>
        {currentBalance !== null && !enoughCredits && (
          <div className="premium-step-insufficient">
            <AlertCircle size={15} />
            积分不足，还需 {totalCost - currentBalance} 积分
            <Link to="/profile/credits" className="go-recharge">去充值</Link>
          </div>
        )}
      </div>

      {/* Actions — confirm always visible */}
      <div className="premium-step-actions">
        <button type="button" className="premium-act-back" onClick={onBack}>返回修改</button>
        {!enoughCredits && currentBalance !== null ? (
          <Link to="/profile/credits" className="premium-act-recharge">
            <CreditCard size={16} /> 去充值
          </Link>
        ) : null}
        <button
          type="button"
          className="premium-act-confirm"
          onClick={handleConfirm}
          disabled={isLoading || (currentBalance !== null && !enoughCredits)}
        >
          {isLoading ? (
            <><Loader size={16} className="spin" /> 发布中...</>
          ) : (
            <><CheckCircle size={16} /> 确认发布 ({totalCost}积分)</>
          )}
        </button>
      </div>
    </div>
  );
};

export default PremiumPostStep;
