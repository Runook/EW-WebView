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
  Clock,
  AlertCircle,
  Star,
  Info,
  Box,
  Layers
} from 'lucide-react';
import './Modal.css';

const DetailsModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  const isLoad = item.commodity || item.cargoType || item.pickupDate;
  const isTruck = item.equipment || item.capacity || item.availableDate;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
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
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="details-content">
          {/* 基础信息 */}
          <div className="details-section">
            <h3>基础信息</h3>
            <div className="details-grid">
              <div className="detail-item">
                <MapPin size={16} />
                <span className="label">起点:</span>
                <span className="value">{item.origin || item.location}</span>
              </div>
              <div className="detail-item">
                <MapPin size={16} />
                <span className="label">终点:</span>
                <span className="value">{item.destination}</span>
              </div>
              <div className="detail-item">
                <Calendar size={16} />
                <span className="label">{isLoad ? '取货日期:' : '可用日期:'}</span>
                <span className="value">{item.pickupDate || item.availableDate}</span>
              </div>
              {item.deliveryDate && (
                <div className="detail-item">
                  <Calendar size={16} />
                  <span className="label">送达日期:</span>
                  <span className="value">{item.deliveryDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* 货物/车辆信息 */}
          <div className="details-section">
            <h3>{isLoad ? '货物信息' : '车辆信息'}</h3>
            <div className="details-grid">
              {isLoad ? (
                <>
                  <div className="detail-item">
                    <Package size={16} />
                    <span className="label">货物类型:</span>
                    <span className="value">{item.commodity || item.cargoType}</span>
                  </div>
                  <div className="detail-item">
                    <Scale size={16} />
                    <span className="label">重量:</span>
                    <span className="value">{item.weight}</span>
                  </div>
                  <div className="detail-item">
                    <Truck size={16} />
                    <span className="label">车型要求:</span>
                    <span className="value">{item.equipment}</span>
                  </div>
                  {item.serviceType === 'FTL' && item.cargoValue && (
                    <div className="detail-item">
                      <DollarSign size={16} />
                      <span className="label">货物估价:</span>
                      <span className="value">{item.cargoValue}</span>
                    </div>
                  )}
                  {item.serviceType === 'LTL' && (item.freightClass || item.nmfcClass) && (
                    <div className="detail-item">
                      <Layers size={16} />
                      <span className="label">NMFC分类:</span>
                      <span className="value">Class {item.freightClass || item.nmfcClass}</span>
                    </div>
                  )}
                  {item.urgency && (
                    <div className="detail-item">
                      <Clock size={16} />
                      <span className="label">紧急程度:</span>
                      <span className="value urgency-badge">{item.urgency}</span>
                    </div>
                  )}
                  {item.pallets && (
                    <div className="detail-item">
                      <Box size={16} />
                      <span className="label">托盘数量:</span>
                      <span className="value">{item.pallets}</span>
                    </div>
                  )}
                  {item.freightClass && item.serviceType === 'LTL' && (
                    <div className="detail-item">
                      <Layers size={16} />
                      <span className="label">NMFC分类:</span>
                      <span className="value">{item.freightClass}级</span>
                    </div>
                  )}
                  {item.density && (
                    <div className="detail-item">
                      <Scale size={16} />
                      <span className="label">密度:</span>
                      <span className="value">{item.density} lbs/ft³</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="detail-item">
                    <Truck size={16} />
                    <span className="label">车型:</span>
                    <span className="value">{item.equipment}</span>
                  </div>
                  <div className="detail-item">
                    <Scale size={16} />
                    <span className="label">载重:</span>
                    <span className="value">{item.capacity}</span>
                  </div>
                  {item.volume && (
                    <div className="detail-item">
                      <Box size={16} />
                      <span className="label">体积:</span>
                      <span className="value">{item.volume}</span>
                    </div>
                  )}
                  {item.preferredLanes && (
                    <div className="detail-item">
                      <MapPin size={16} />
                      <span className="label">优选线路:</span>
                      <span className="value">{item.preferredLanes}</span>
                    </div>
                  )}
                  {item.specialServices && (
                    <div className="detail-item">
                      <Star size={16} />
                      <span className="label">特殊服务:</span>
                      <span className="value">{item.specialServices}</span>
                    </div>
                  )}
                </>
              )}
              <div className="detail-item">
                <Info size={16} />
                <span className="label">服务类型:</span>
                <span className={`value service-badge ${item.serviceType?.toLowerCase()}`}>
                  {item.serviceType === 'FTL' ? '整车运输 (FTL)' : '零担运输 (LTL)'}
                </span>
              </div>
            </div>
          </div>

          {/* 价格信息 */}
          <div className="details-section">
            <h3>价格信息</h3>
            <div className="details-grid">
              <div className="detail-item">
                <DollarSign size={16} />
                <span className="label">{isLoad ? '最高报价:' : '费率范围:'}</span>
                <span className="value price-highlight">{item.rate || item.rateRange}</span>
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="details-section">
            <h3>联系信息</h3>
            <div className="details-grid">
              <div className="detail-item">
                <Building size={16} />
                <span className="label">公司名称:</span>
                <span className="value">{item.company}</span>
              </div>
              <div className="detail-item">
                <Phone size={16} />
                <span className="label">联系电话:</span>
                <span className="value phone-number">{item.phone}</span>
              </div>
              {item.rating && (
                <div className="detail-item">
                  <Star size={16} />
                  <span className="label">评分:</span>
                  <span className="value rating">
                    ⭐ {item.rating}/5.0
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 额外要求 */}
          {(item.requirements || item.notes) && (
            <div className="details-section">
              <h3>特殊要求</h3>
              <div className="requirements-content">
                <AlertCircle size={16} />
                <p>{item.requirements || item.notes}</p>
              </div>
            </div>
          )}

          {/* 联系按钮 */}
          <div className="details-actions">
            <button 
              className="btn btn-primary contact-action"
              onClick={() => window.open(`tel:${item.phone}`)}
            >
              <Phone size={16} />
              立即联系
            </button>
            <button className="btn btn-secondary quote-action">
              <DollarSign size={16} />
              询价报价
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal; 