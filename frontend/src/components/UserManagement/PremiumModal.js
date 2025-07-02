import React, { useState, useEffect } from 'react';
import { X, Star, Zap, Clock, CreditCard } from 'lucide-react';
import './PremiumModal.css';

const PremiumModal = ({ isOpen, onClose, postType, postId, onSuccess }) => {
  const [premiumType, setPremiumType] = useState('top');
  const [duration, setDuration] = useState(24);
  const [systemConfig, setSystemConfig] = useState({});
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSystemConfig();
      fetchUserCredits();
    }
  }, [isOpen]);

  const fetchSystemConfig = async () => {
    try {
      const response = await fetch('/api/user-management/system-config');
      if (response.ok) {
        const data = await response.json();
        setSystemConfig(data.data);
      }
    } catch (error) {
      console.error('获取系统配置失败:', error);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user-management/credits', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.data.current);
      }
    } catch (error) {
      console.error('获取用户积分失败:', error);
    }
  };

  const getCost = () => {
    switch (premiumType) {
      case 'top':
        if (duration <= 24) return systemConfig['premium_costs.top_24h'] || 50;
        if (duration <= 72) return systemConfig['premium_costs.top_72h'] || 120;
        return systemConfig['premium_costs.top_168h'] || 250;
      case 'highlight':
        return systemConfig['premium_costs.highlight'] || 30;
      case 'urgent':
        return systemConfig['premium_costs.urgent'] || 20;
      default:
        return 0;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const cost = getCost();
      
      if (userCredits < cost) {
        alert(`积分不足！需要 ${cost} 积分，您当前有 ${userCredits} 积分`);
        return;
      }

      const response = await fetch(`/api/user-management/posts/${postType}/${postId}/premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          premiumType,
          duration: premiumType === 'top' ? duration : 24
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('高级功能开通成功！');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || '开通失败');
      }
    } catch (error) {
      console.error('开通高级功能失败:', error);
      alert('开通失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const cost = getCost();

  return (
    <div className="premium-modal-overlay">
      <div className="premium-modal">
        <div className="premium-modal-header">
          <h2>开通高级功能</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="premium-modal-content">
          <div className="current-credits">
            <CreditCard size={16} />
            当前积分：{userCredits}
          </div>

          <div className="premium-options">
            <div 
              className={`premium-option ${premiumType === 'top' ? 'selected' : ''}`}
              onClick={() => setPremiumType('top')}
            >
              <div className="option-icon">
                <Star size={24} />
              </div>
              <div className="option-info">
                <h3>置顶显示</h3>
                <p>您的发布将显示在列表最上方，获得更多曝光</p>
              </div>
              <div className="option-price">
                {duration <= 24 ? systemConfig['premium_costs.top_24h'] || 50 :
                 duration <= 72 ? systemConfig['premium_costs.top_72h'] || 120 :
                 systemConfig['premium_costs.top_168h'] || 250} 积分
              </div>
            </div>

            <div 
              className={`premium-option ${premiumType === 'highlight' ? 'selected' : ''}`}
              onClick={() => setPremiumType('highlight')}
            >
              <div className="option-icon">
                <Zap size={24} />
              </div>
              <div className="option-info">
                <h3>高亮显示</h3>
                <p>您的发布将以特殊颜色高亮显示，更加醒目</p>
              </div>
              <div className="option-price">
                {systemConfig['premium_costs.highlight'] || 30} 积分
              </div>
            </div>

            <div 
              className={`premium-option ${premiumType === 'urgent' ? 'selected' : ''}`}
              onClick={() => setPremiumType('urgent')}
            >
              <div className="option-icon">
                <Clock size={24} />
              </div>
              <div className="option-info">
                <h3>紧急标记</h3>
                <p>为您的发布添加"紧急"标记，提高关注度</p>
              </div>
              <div className="option-price">
                {systemConfig['premium_costs.urgent'] || 20} 积分
              </div>
            </div>
          </div>

          {premiumType === 'top' && (
            <div className="duration-selection">
              <h4>选择置顶时长</h4>
              <div className="duration-options">
                <label className={duration === 24 ? 'selected' : ''}>
                  <input
                    type="radio"
                    value={24}
                    checked={duration === 24}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                  />
                  24小时 ({systemConfig['premium_costs.top_24h'] || 50} 积分)
                </label>
                <label className={duration === 72 ? 'selected' : ''}>
                  <input
                    type="radio"
                    value={72}
                    checked={duration === 72}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                  />
                  3天 ({systemConfig['premium_costs.top_72h'] || 120} 积分)
                </label>
                <label className={duration === 168 ? 'selected' : ''}>
                  <input
                    type="radio"
                    value={168}
                    checked={duration === 168}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                  />
                  7天 ({systemConfig['premium_costs.top_168h'] || 250} 积分)
                </label>
              </div>
            </div>
          )}

          <div className="cost-summary">
            <div className="cost-item">
              <span>费用：</span>
              <span className="cost-amount">{cost} 积分</span>
            </div>
            <div className="cost-item">
              <span>余额：</span>
              <span className={userCredits >= cost ? 'sufficient' : 'insufficient'}>
                {userCredits} 积分
              </span>
            </div>
            {userCredits < cost && (
              <div className="insufficient-notice">
                积分不足，还需要 {cost - userCredits} 积分
              </div>
            )}
          </div>
        </div>

        <div className="premium-modal-actions">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button 
            className="confirm-btn" 
            onClick={handleSubmit}
            disabled={loading || userCredits < cost}
          >
            {loading ? '处理中...' : `开通 (${cost} 积分)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
