import React from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Package, 
  Truck, 
  Scale,
  DollarSign,
  Phone,
  Building,
  AlertCircle,
  Star,
  Info,
  Box,
  Layers,
  Hash,
  Mail,
  User,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Lock,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Modal.css';

/**
 * 详情模态框组件
 * 功能：根据用户实际填写的字段动态显示内容
 * - 必填字段：始终显示
 * - 可选字段：仅在用户填写时显示  
 * - 自动计算字段：始终显示（EWID、NMFC分类等）
 */
const DetailsModal = ({ isOpen, onClose, item }) => {
  const { isAuthenticated } = useAuth();

  if (!isOpen || !item) return null;

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              <Lock size={24} />
              需要登录
            </h2>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="login-required-content">
            <div className="login-icon">
              <Eye size={64} />
            </div>
            <h3>查看详情需要登录</h3>
            <p>为了保护发布人的隐私信息，查看完整的货源/车源详情需要先登录系统。</p>
            <div className="login-actions">
              <button className="btn btn-primary" onClick={() => {
                onClose();
                alert('请先登录系统');
              }}>
                <User size={16} />
                立即登录
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === 数据处理函数 ===
  const isLoad = item.commodity || item.cargoType || item.pickupDate;
  const isLTL = item.serviceType === 'LTL';
  const isFTL = item.serviceType === 'FTL';

  /**
   * 检查字段是否有值（非空、非undefined、非null）
   */
  const hasValue = (value) => {
    return value !== null && value !== undefined && value !== '' && value !== 'undefined';
  };

  /**
   * 获取字段值，支持多个备选字段
   */
  const getValue = (...fields) => {
    for (const field of fields) {
      if (hasValue(field)) return field;
    }
    return null;
  };

  /**
   * 获取原始数据中的值
   */
  const getOriginalValue = (path) => {
    if (!item.originalData) return null;
    const keys = path.split('.');
    let value = item.originalData;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return null;
      }
    }
    return hasValue(value) ? value : null;
  };

  // === 渲染辅助组件 ===
  
  /**
   * 信息行组件
   */
  const InfoRow = ({ label, value, highlight = false, className = '' }) => {
    if (!hasValue(value)) return null;
    
    return (
      <div className={`info-item ${className}`}>
        <span className="label">{label}</span>
        <span className={`value ${highlight ? 'highlight' : ''}`}>{value}</span>
      </div>
    );
  };

  /**
   * 信息卡片组件
   */
  const InfoCard = ({ title, icon, children, className = '' }) => {
    // 检查是否有任何子内容
    const hasContent = React.Children.toArray(children).some(child => child !== null);
    if (!hasContent) return null;

    return (
      <div className={`info-card ${className}`}>
        <h3>
          {icon}
          {title}
        </h3>
        <div className="card-content">
          {children}
        </div>
      </div>
    );
  };

  /**
   * 格式化发布时间
   */
  const formatPublicationDate = (date) => {
    if (!date) return null;
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - posted) / (1000 * 60));
      return diffInMinutes <= 0 ? '刚刚发布' : `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isLoad ? (
              <>
                <Package size={24} />
                货源详情
              </>
            ) : (
              <>
                <Truck size={24} />
                车源详情
              </>
            )}
            {item.serviceType && (
              <span className={`service-badge ${item.serviceType?.toLowerCase()}`}>
                {item.serviceType === 'FTL' ? '整车运输' : '零担运输'}
              </span>
            )}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="details-content">
          {/* === 自动生成的单号信息 === */}
          {getValue(item.ewid, item.EWID) && (
            <div className="ewid-section">
              <Hash size={16} />
              <span>单号：{getValue(item.ewid, item.EWID)}</span>
              {getValue(item.publicationDate, item.postedTime) && (
                <>
                  <Clock size={14} style={{ marginLeft: '1rem' }} />
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    {item.publicationDate 
                      ? formatPublicationDate(item.publicationDate)
                      : item.postedTime}
                  </span>
                </>
              )}
            </div>
          )}

          {/* === 基础运输信息（必填项） === */}
          <InfoCard title="基础运输信息" icon={<MapPin size={18} />} className="transport-info">
            <div className="info-row">
              <InfoRow 
                label="起点" 
                value={getValue(item.origin, item.location)} 
              />
              <InfoRow 
                label="终点" 
                value={getValue(item.destination)} 
              />
            </div>
            <div className="info-row">
              <InfoRow 
                label={isLoad ? "取货日期" : "可用日期"} 
                value={getValue(item.pickupDate, item.availableDate)} 
              />
              {getValue(item.deliveryDate, getOriginalValue('deliveryDate')) && (
                <InfoRow 
                  label="送达日期" 
                  value={getValue(item.deliveryDate, getOriginalValue('deliveryDate'))} 
                />
              )}
            </div>
            
          
          </InfoCard>

          {/* === 货物信息 === */}
          {isLoad && (
            <InfoCard title="货物信息" icon={<Package size={18} />} className="cargo-info">
              {/* FTL货物信息 */}
              {isFTL && (
                <>
                  <div className="info-row">
                    {getValue(item.commodity, item.cargoType, getOriginalValue('cargoType')) && (
                      <InfoRow 
                        label="货物类型" 
                        value={getValue(item.commodity, item.cargoType, getOriginalValue('cargoType'))} 
                      />
                    )}
                    <InfoRow 
                      label="重量" 
                      value={getValue(item.weight) + ' lb'} 
                    />
                  </div>
                  
                  {/* FTL可选字段 */}
                  {getValue(item.cargoValue, getOriginalValue('cargoValue')) && (
                    <div className="info-row">
                      <InfoRow 
                        label="货物估价" 
                        value={getValue(item.cargoValue, getOriginalValue('cargoValue'))} 
                        highlight={true}
                      />
                    </div>
                  )}
                  
                  {getValue(item.shippingNumber, getOriginalValue('shippingNumber')) && (
                    <div className="info-row">
                      <InfoRow 
                        label="初始单号" 
                        value={getValue(item.shippingNumber, getOriginalValue('shippingNumber'))} 
                      />
                    </div>
                  )}
                </>
              )}

              {/* LTL货物信息 */}
              {isLTL && (
                <>
                  {/* LTL多货物项目标识 */}
                  {getOriginalValue('totalItems') > 1 && (
                    <div className="ltl-multi-info">
                      <span className="multi-tag">
                        第 {getOriginalValue('itemIndex')} 项 / 共 {getOriginalValue('totalItems')} 项
                      </span>
                    </div>
                  )}
                  
                  <div className="ltl-item-details">
                    <div className="info-row">
                      {getOriginalValue('currentItem.description') && (
                        <InfoRow 
                          label="货物描述" 
                          value={getOriginalValue('currentItem.description')} 
                        />
                      )}
                      <InfoRow 
                        label="重量" 
                        value={getValue(item.weight, getOriginalValue('currentItem.weight'), getOriginalValue('weight')) + ' lb'} 
                      />
                    </div>
                    
                    <div className="info-row">
                      <InfoRow 
                        label="托板数量" 
                        value={getValue(item.pallets, getOriginalValue('currentItem.pallets'), getOriginalValue('pallets'))} 
                      />
                      {getValue(getOriginalValue('currentItem.freightClass'), getOriginalValue('freightClass'), item.freightClass) && (
                        <InfoRow 
                          label="NMFC分类" 
                          value={`Class ${getValue(getOriginalValue('currentItem.freightClass'), getOriginalValue('freightClass'), item.freightClass)}`}
                          className="nmfc-highlight"
                        />
                      )}
                    </div>

                    {/* LTL尺寸信息 - 仅在填写时显示 */}
                    {(getOriginalValue('currentItem.length') || getOriginalValue('currentItem.width') || getOriginalValue('currentItem.height') || 
                      getOriginalValue('length') || getOriginalValue('width') || getOriginalValue('height')) && (
                      <div className="info-row">
                        <InfoRow 
                          label="尺寸 (长×宽×高)" 
                          value={`${getValue(getOriginalValue('currentItem.length'), getOriginalValue('length')) || '?'} × ${getValue(getOriginalValue('currentItem.width'), getOriginalValue('width')) || '?'} × ${getValue(getOriginalValue('currentItem.height'), getOriginalValue('height')) || '?'} 英寸`}
                        />
                        {getValue(getOriginalValue('currentItem.volume'), getOriginalValue('volume')) && (
                          <InfoRow 
                            label="体积" 
                            value={`${getValue(getOriginalValue('currentItem.volume'), getOriginalValue('volume'))} 立方英尺`}
                          />
                        )}
                      </div>
                    )}

                    {/* LTL密度信息 - 自动计算 */}
                    {getValue(getOriginalValue('currentItem.density'), getOriginalValue('density')) && (
                      <div className="info-row">
                        <InfoRow 
                          label="密度" 
                          value={`${getValue(getOriginalValue('currentItem.density'), getOriginalValue('density'))} lbs/ft³`}
                        />
                      </div>
                    )}

                    {/* LTL特殊属性 - 仅在设置时显示 */}
                    {(getOriginalValue('currentItem.stackable') !== undefined || getOriginalValue('currentItem.fragile') || getOriginalValue('currentItem.hazmat') ||
                      getOriginalValue('stackable') !== undefined || getOriginalValue('fragile') || getOriginalValue('hazmat')) && (
                      <div className="special-tags">
                        <span className="label">特殊属性：</span>
                        <div className="tags">
                          {getValue(getOriginalValue('currentItem.stackable'), getOriginalValue('stackable')) && (
                            <span className="tag positive">可堆叠</span>
                          )}
                          {getValue(getOriginalValue('currentItem.fragile'), getOriginalValue('fragile')) && (
                            <span className="tag warning">易碎品</span>
                          )}
                          {getValue(getOriginalValue('currentItem.hazmat'), getOriginalValue('hazmat')) && (
                            <span className="tag danger">危险品</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* LTL初始单号 - 可选字段 */}
                    {getValue(getOriginalValue('currentItem.shippingNumber'), getOriginalValue('shippingNumber'), item.shippingNumber) && (
                      <div className="info-row">
                        <InfoRow 
                          label="初始单号" 
                          value={getValue(getOriginalValue('currentItem.shippingNumber'), getOriginalValue('shippingNumber'), item.shippingNumber)} 
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </InfoCard>
          )}

          {/* === 车源信息 === */}
          {!isLoad && (
            <InfoCard title="车辆信息" icon={<Truck size={18} />} className="truck-info">
              <div className="info-row">
                {getValue(item.equipment) && (
                  <InfoRow 
                    label="车辆设备" 
                    value={getValue(item.equipment)} 
                  />
                )}
                {getValue(item.capacity) && (
                  <InfoRow 
                    label="载重能力" 
                    value={getValue(item.capacity)} 
                  />
                )}
              </div>
              {getValue(item.serviceType) && (
                <div className="info-row">
                  <InfoRow 
                    label="服务类型" 
                    value={getValue(item.serviceType)} 
                  />
                </div>
              )}
            </InfoCard>
          )}

          

          {/* === 发布人信息（必填项） === */}
          <InfoCard title="发布人信息" icon={<User size={18} />} className="contact-info">
            <div className="info-row">
              <InfoRow 
                label="发布人名称" 
                value={getValue(item.company, item.companyName)} 
              />
              <InfoRow 
                label="联系电话" 
                value={getValue(item.phone, item.contactPhone)} 
                className="phone"
              />
            </div>
            
            {/* 邮箱 - 可选字段 */}
            {getValue(item.contactEmail, getOriginalValue('contactEmail')) && (
              <div className="info-row">
                <InfoRow 
                  label="联系邮箱" 
                  value={getValue(item.contactEmail, getOriginalValue('contactEmail'))} 
                />
              </div>
            )}
          </InfoCard>

          {/* === 备注信息 - 可选字段 === */}
          {getValue(item.notes, item.specialRequirements, getOriginalValue('notes')) && (
            <InfoCard title="备注信息" icon={<AlertCircle size={18} />} className="notes-info">
              <p className="notes-text">
                {getValue(item.notes, item.specialRequirements, getOriginalValue('notes'))}
              </p>
            </InfoCard>
          )}

          {/* === 操作按钮 === */}
          <div className="action-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => window.open(`tel:${getValue(item.phone, item.contactPhone)}`)}
            >
              <Phone size={16} />
              立即联系
            </button>
            <button className="btn btn-secondary">
              <DollarSign size={16} />
              询价报价
            </button>
            {getValue(item.contactEmail, getOriginalValue('contactEmail')) && (
              <button 
                className="btn btn-outline"
                onClick={() => window.open(`mailto:${getValue(item.contactEmail, getOriginalValue('contactEmail'))}`)}
              >
                <Mail size={16} />
                发送邮件
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .details-modal .modal-content {
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .service-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-left: auto;
        }

        .service-badge.ftl {
          background: #e3f2fd;
          color: #1976d2;
        }

        .service-badge.ltl {
          background: #e8f5e8;
          color: #34C759;
        }

        .details-content {
          padding: 1.5rem;
        }

        .ewid-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8f9fa;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 600;
          color: #666;
        }

        .info-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .info-card h3 {
          background: #f8f9fa;
          margin: 0;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .card-content {
          padding: 1.5rem;
        }

        .info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 500;
        }

        .value {
          font-size: 0.95rem;
          color: #333;
          font-weight: 600;
        }

        .value.highlight {
          color: #e65100;
          font-weight: 700;
        }

        .phone .value {
          color: #1976d2;
          cursor: pointer;
        }

        .nmfc-highlight .value {
          color: #34C759;
          font-weight: 700;
        }

        .ltl-multi-info {
          margin-bottom: 1rem;
          text-align: center;
        }

        .multi-tag {
          background: #e8f5e8;
          color: #34C759;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .special-tags {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tag {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .tag.positive {
          background: #e8f5e8;
          color: #34C759;
        }

        .tag.warning {
          background: #fff3e0;
          color: #ff9800;
        }

        .tag.danger {
          background: #ffebee;
          color: #f44336;
        }

        .price-display {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-label {
          font-size: 0.9rem;
          color: #666;
        }

        .price-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #e65100;
        }

        .price-value.main-price {
          font-size: 1.3rem;
        }

        .notes-text {
          font-size: 0.95rem;
          line-height: 1.5;
          color: #333;
          margin: 0;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
          flex-wrap: wrap;
        }

        .action-buttons .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .btn-primary {
          background: #34C759;
          color: white;
          border: none;
        }

        .btn-primary:hover {
          background: #2ecc71;
        }

        .btn-secondary {
          background: #1976d2;
          color: white;
          border: none;
        }

        .btn-secondary:hover {
          background: #1565c0;
        }

        .btn-outline {
          background: white;
          color: #666;
          border: 1px solid #ddd;
        }

        .btn-outline:hover {
          background: #f5f5f5;
        }

        .login-required-content {
          text-align: center;
          padding: 2rem;
        }

        .login-icon {
          margin-bottom: 1rem;
          color: #666;
        }

        .login-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        @media (max-width: 768px) {
          .details-modal .modal-content {
            max-width: 95vw;
            margin: 1rem;
          }

          .details-content {
            padding: 1rem;
          }

          .info-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-buttons .btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default DetailsModal; 