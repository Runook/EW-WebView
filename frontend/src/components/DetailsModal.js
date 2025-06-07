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
  Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Modal.css';

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

  const isLoad = item.commodity || item.cargoType || item.pickupDate;
  const isLTLWithMultipleItems = item.serviceType === 'LTL' && 
    item.originalData && 
    item.originalData.totalItems > 1;

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
            <span className={`service-badge ${item.serviceType?.toLowerCase()}`}>
              {item.serviceType === 'FTL' ? '整车运输' : '零担运输'}
            </span>
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="details-content">
          {/* EWID单号 */}
          {(item.ewid || item.EWID) && (
            <div className="ewid-section">
              <Hash size={16} />
              <span>单号：{item.ewid || item.EWID}</span>
            </div>
          )}

          {/* 运输信息卡片 */}
          <div className="info-card transport-info">
            <h3>
              <MapPin size={18} />
              运输信息
            </h3>
            <div className="card-content">
              <div className="info-row">
                <div className="info-item">
                  <span className="label">起点</span>
                  <span className="value">{item.origin || item.location}</span>
                </div>
                <div className="info-item">
                  <span className="label">终点</span>
                  <span className="value">{item.destination}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <span className="label">取货日期</span>
                  <span className="value">{item.pickupDate || item.availableDate}</span>
                </div>
                <div className="info-item">
                  <span className="label">送达日期</span>
                  <span className="value">{item.deliveryDate || '待确认'}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <span className="label">车型要求</span>
                  <span className="value">{item.truckType || item.originalData?.truckType || item.equipment || '不限'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 货物信息卡片 */}
          <div className="info-card cargo-info">
            <h3>
              <Package size={18} />
              货物信息
            </h3>
            <div className="card-content">
              <div className="info-row">
                <div className="info-item">
                  <span className="label">货物类型</span>
                  <span className="value">{item.commodity || item.cargoType}</span>
                </div>
                {item.serviceType === 'FTL' && (
                  <div className="info-item">
                    <span className="label">重量</span>
                    <span className="value">{item.weight} lb</span>
                  </div>
                )}
              </div>

              {/* FTL货物估价 */}
              {item.serviceType === 'FTL' && (item.cargoValue || item.originalData?.cargoValue) && (
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">货物估价</span>
                    <span className="value highlight">{item.cargoValue || item.originalData?.cargoValue}</span>
                  </div>
                </div>
              )}

              {/* LTL多货物信息 */}
              {item.serviceType === 'LTL' && (
                <>
                  {isLTLWithMultipleItems && (
                    <div className="ltl-multi-info">
                      <span className="multi-tag">
                        第 {item.originalData.itemIndex} 项 / 共 {item.originalData.totalItems} 项
                      </span>
                    </div>
                  )}
                  
                  <div className="ltl-item-details">
                    <div className="info-row">
                      <div className="info-item">
                        <span className="label">货物描述</span>
                        <span className="value">{item.originalData?.currentItem?.description || '未提供'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">重量</span>
                        <span className="value">{item.weight || item.originalData?.currentItem?.weight} lb</span>
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-item">
                        <span className="label">托板数量</span>
                        <span className="value">{item.originalData?.currentItem?.pallets || item.pallets}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">NMFC分类</span>
                        <span className="value nmfc-highlight">
                          Class {item.originalData?.currentItem?.freightClass || item.freightClass}
                        </span>
                      </div>
                    </div>
                    
                    {/* 特殊属性标签 */}
                    <div className="special-tags">
                      <span className="label">特殊属性：</span>
                      <div className="tags">
                        {(item.originalData?.currentItem?.stackable || item.originalData?.stackable) && (
                          <span className="tag positive">可堆叠</span>
                        )}
                        {(item.originalData?.currentItem?.fragile || item.originalData?.fragile) && (
                          <span className="tag warning">易碎品</span>
                        )}
                        {(item.originalData?.currentItem?.hazmat || item.originalData?.hazmat) && (
                          <span className="tag danger">危险品</span>
                        )}
                        {!(item.originalData?.currentItem?.stackable || item.originalData?.stackable) && 
                         !(item.originalData?.currentItem?.fragile || item.originalData?.fragile) && 
                         !(item.originalData?.currentItem?.hazmat || item.originalData?.hazmat) && (
                          <span className="tag neutral">普通货物</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 价格信息卡片 */}
          <div className="info-card price-info">
            <h3>
              <DollarSign size={18} />
              价格信息
            </h3>
            <div className="card-content">
              <div className="price-display">
                {item.serviceType === 'LTL' && isLTLWithMultipleItems ? (
                  <>
                    <div className="price-item">
                      <span className="price-label">该项目价格</span>
                      <span className="price-value main-price">
                        {item.originalData?.currentItem?.estimatedRate || item.rate}
                      </span>
                    </div>
                    {item.originalData?.maxRate && (
                      <div className="price-item">
                        <span className="price-label">总参考价格</span>
                        <span className="price-value">{item.originalData.maxRate}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="price-item">
                    <span className="price-label">预估运费</span>
                    <span className="price-value main-price">{item.rate || item.maxRate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 发布人信息卡片 */}
          <div className="info-card contact-info">
            <h3>
              <User size={18} />
              发布人信息
            </h3>
            <div className="card-content">
              <div className="info-row">
                <div className="info-item">
                  <span className="label">发布人名称</span>
                  <span className="value">{item.company || item.companyName}</span>
                </div>
                <div className="info-item">
                  <span className="label">联系电话</span>
                  <span className="value phone">{item.phone || item.contactPhone}</span>
                </div>
              </div>
              {(item.contactEmail || item.originalData?.contactEmail) && (
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">联系邮箱</span>
                    <span className="value">{item.contactEmail || item.originalData?.contactEmail}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 备注信息 */}
          {(item.notes || item.specialRequirements || item.originalData?.notes) && (
            <div className="info-card notes-info">
              <h3>
                <AlertCircle size={18} />
                备注信息
              </h3>
              <div className="card-content">
                <p className="notes-text">
                  {item.notes || item.specialRequirements || item.originalData?.notes}
                </p>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="action-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => window.open(`tel:${item.phone || item.contactPhone}`)}
            >
              <Phone size={16} />
              立即联系
            </button>
            <button className="btn btn-secondary">
              <DollarSign size={16} />
              询价报价
            </button>
            {(item.contactEmail || item.originalData?.contactEmail) && (
              <button 
                className="btn btn-outline"
                onClick={() => window.open(`mailto:${item.contactEmail || item.originalData?.contactEmail}`)}
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

        .value.phone {
          color: #1976d2;
          font-family: monospace;
        }

        .nmfc-highlight {
          color: #34C759 !important;
          font-weight: 700 !important;
        }

        .ltl-multi-info {
          margin-bottom: 1rem;
          text-align: center;
        }

        .multi-tag {
          background: #34C759;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .ltl-item-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .special-tags {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }

        .special-tags .label {
          margin-bottom: 0.5rem;
          display: block;
        }

        .tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tag {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .tag.positive {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .tag.warning {
          background: #fff3e0;
          color: #f57c00;
        }

        .tag.danger {
          background: #ffebee;
          color: #d32f2f;
        }

        .tag.neutral {
          background: #f5f5f5;
          color: #666;
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
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .price-label {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }

        .price-value {
          font-size: 1.1rem;
          color: #333;
          font-weight: 600;
        }

        .price-value.main-price {
          font-size: 1.3rem;
          color: #e65100;
          font-weight: 700;
        }

        .notes-text {
          margin: 0;
          line-height: 1.6;
          color: #555;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          padding-top: 1rem;
        }

        .action-buttons .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .btn-primary {
          background: #34C759;
          color: white;
        }

        .btn-primary:hover {
          background: #2ecc71;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #666;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .btn-outline {
          background: white;
          color: #1976d2;
          border: 2px solid #1976d2;
        }

        .btn-outline:hover {
          background: #1976d2;
          color: white;
        }

        .login-required-content {
          text-align: center;
          padding: 2rem;
        }

        .login-icon {
          color: #666;
          margin-bottom: 1rem;
        }

        .login-required-content h3 {
          margin-bottom: 1rem;
          color: #333;
        }

        .login-required-content p {
          color: #666;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .login-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
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

          .price-item {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
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