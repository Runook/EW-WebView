import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  Star, 
  Zap, 
  Clock,
  AlertCircle,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import './PremiumPostModal.css';

const PremiumPostModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  postType,
  formData 
}) => {
  const [systemConfig, setSystemConfig] = useState({});
  const [userCredits, setUserCredits] = useState(null);
  const [selectedPremium, setSelectedPremium] = useState(null);
  const [premiumDuration, setPremiumDuration] = useState(24);
  const [loading, setLoading] = useState(false);

  // 获取系统配置和用户积分
  useEffect(() => {
    if (isOpen) {
      fetchSystemConfig();
      fetchUserCredits();
    }
  }, [isOpen]);

  const fetchSystemConfig = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/user-management/system-config`);
      if (response.ok) {
        const data = await response.json();
        setSystemConfig(data.data);
        console.log('系统配置获取成功:', data.data);
      } else {
        console.error('系统配置获取失败:', response.status);
      }
    } catch (error) {
      console.error('获取系统配置失败:', error);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/user-management/credits`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.data);
        console.log('用户积分获取成功:', data.data);
      } else {
        console.error('用户积分获取失败:', response.status);
      }
    } catch (error) {
      console.error('获取用户积分失败:', error);
    }
  };

  // 获取发布费用
  const getPostCost = () => {
    const costKey = `post_costs.${postType}`;
    return systemConfig[costKey] || 0;
  };

  // 获取置顶费用
  const getPremiumCost = () => {
    if (!selectedPremium) return 0;
    
    switch (selectedPremium) {
      case 'top':
        return systemConfig[`premium_costs.top_${premiumDuration}h`] || 0;
      case 'highlight':
        return systemConfig['premium_costs.highlight'] || 0;
      
      default:
        return 0;
    }
  };

  // 总费用
  const getTotalCost = () => {
    return getPostCost() + getPremiumCost();
  };

  // 检查积分是否足够
  const hasEnoughCredits = () => {
    return userCredits && userCredits.current >= getTotalCost();
  };

  // 获取发布类型中文名称
  const getPostTypeName = () => {
    const nameMap = {
      load: '货源信息',
      truck: '车源信息',
      company: '企业信息',
      job: '职位信息',
      resume: '简历信息'
    };
    return nameMap[postType] || postType;
  };

  // 处理发布确认
  const handleConfirm = async () => {
    if (!hasEnoughCredits()) {
      alert('积分余额不足，请先充值');
      return;
    }

    setLoading(true);
    try {
      // 调用发布确认回调
      await onConfirm({
        formData,
        premium: selectedPremium ? {
          type: selectedPremium,
          duration: selectedPremium === 'top' ? premiumDuration : undefined
        } : null
      });
      
      onClose();
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理充值跳转
  const handleRecharge = () => {
    onClose();
    // 跳转到充值页面
    window.location.href = '/profile/recharge';
  };

  if (!isOpen) return null;

  return (
    <div className="premium-post-modal-overlay">
      <div className="premium-post-modal">
        <div className="modal-header">
          <h2>发布{getPostTypeName()}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* 积分余额显示 */}
          <div className="credits-info">
            <div className="credits-balance">
              <Coins size={20} />
              <span>当前积分余额：{userCredits?.current || 0}</span>
            </div>
          </div>

          {/* 发布费用 */}
          <div className="cost-section">
            <h3>发布费用</h3>
            <div className="cost-item">
              <span>基础发布费用</span>
              <span className="cost">{getPostCost()} 积分</span>
            </div>
          </div>

          {/* 高级功能选项 */}
          <div className="premium-section">
            <h3>高级功能（可选）</h3>
            
            <div className="premium-options">
              <div 
                className={`premium-option ${selectedPremium === 'top' ? 'selected' : ''}`}
                onClick={() => setSelectedPremium(selectedPremium === 'top' ? null : 'top')}
              >
                <div className="option-icon">
                  <Star size={20} />
                </div>
                <div className="option-content">
                  <h4>置顶显示</h4>
                  <p>内容显示在列表最上方，获得更多关注</p>
                  {selectedPremium === 'top' && (
                    <div className="duration-selector">
                      <label>
                        <input
                          type="radio"
                          name="duration"
                          value={24}
                          checked={premiumDuration === 24}
                          onChange={(e) => setPremiumDuration(parseInt(e.target.value))}
                        />
                        24小时 ({systemConfig['premium_costs.top_24h'] || 0}积分)
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="duration"
                          value={72}
                          checked={premiumDuration === 72}
                          onChange={(e) => setPremiumDuration(parseInt(e.target.value))}
                        />
                        3天 ({systemConfig['premium_costs.top_72h'] || 0}积分)
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="duration"
                          value={168}
                          checked={premiumDuration === 168}
                          onChange={(e) => setPremiumDuration(parseInt(e.target.value))}
                        />
                        7天 ({systemConfig['premium_costs.top_168h'] || 0}积分)
                      </label>
                    </div>
                  )}
                </div>
                <div className="option-price">
                  {selectedPremium === 'top' ? getPremiumCost() : systemConfig['premium_costs.top_24h'] || 0} 积分
                </div>
              </div>

              <div 
                className={`premium-option ${selectedPremium === 'highlight' ? 'selected' : ''}`}
                onClick={() => setSelectedPremium(selectedPremium === 'highlight' ? null : 'highlight')}
              >
                <div className="option-icon">
                  <Zap size={20} />
                </div>
                <div className="option-content">
                  <h4>高亮显示</h4>
                  <p>特殊颜色突出显示，更容易被注意</p>
                </div>
                <div className="option-price">
                  {systemConfig['premium_costs.highlight'] || 0} 积分
                </div>
              </div>


            </div>
          </div>

          {/* 费用总结 */}
          <div className="cost-summary">
            <div className="summary-row">
              <span>基础发布费用</span>
              <span>{getPostCost()} 积分</span>
            </div>
            {selectedPremium && (
              <div className="summary-row">
                <span>高级功能费用</span>
                <span>{getPremiumCost()} 积分</span>
              </div>
            )}
            <div className="summary-total">
              <span>总计</span>
              <span className={hasEnoughCredits() ? 'sufficient' : 'insufficient'}>
                {getTotalCost()} 积分
              </span>
            </div>
            
            {!hasEnoughCredits() && (
              <div className="insufficient-notice">
                <AlertCircle size={16} />
                <span>积分余额不足，还需要 {getTotalCost() - (userCredits?.current || 0)} 积分</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            取消
          </button>
          
          {!hasEnoughCredits() ? (
            <button className="recharge-btn" onClick={handleRecharge}>
              <CreditCard size={16} />
              去充值
            </button>
          ) : (
            <button 
              className="confirm-btn" 
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <span>发布中...</span>
              ) : (
                <>
                  <CheckCircle size={16} />
                  确认发布
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumPostModal; 