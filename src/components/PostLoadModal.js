import React, { useState } from 'react';
import { X, MapPin, Package, Calendar, DollarSign, Truck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Modal.css';

const PostLoadModal = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    pickupDate: '',
    deliveryDate: '',
    equipment: '',
    weight: '',
    length: '',
    rate: '',
    distance: '',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    companyName: ''
  });

  const equipmentTypes = [
    { value: 'dry-van', label: t('common.dryVan') },
    { value: 'reefer', label: t('common.reefer') },
    { value: 'flatbed', label: t('common.flatbed') },
    { value: 'step-deck', label: t('common.stepDeck') },
    { value: 'lowboy', label: t('common.lowboy') },
    { value: 'tanker', label: t('common.tanker') }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: Date.now(),
      type: 'load',
      postedDate: new Date().toISOString()
    });
    setFormData({
      origin: '',
      destination: '',
      pickupDate: '',
      deliveryDate: '',
      equipment: '',
      weight: '',
      length: '',
      rate: '',
      distance: '',
      description: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      companyName: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('freight.postLoad')}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h3>{t('freight.loadInfo')}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  {t('freight.origin')}
                </label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder={t('freight.origin')}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  {t('freight.destination')}
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder={t('freight.destination')}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  {t('freight.pickupDate')}
                </label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  {t('freight.deliveryDate')}
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Truck size={16} />
                  {t('freight.equipment')}
                </label>
                <select
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('freight.selectEquipment')}</option>
                  {equipmentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Package size={16} />
                  {t('freight.weight')}
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="45000"
                />
              </div>

              <div className="form-group">
                <label>
                  <Package size={16} />
                  {t('freight.length')}
                </label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  placeholder="48"
                />
              </div>

              <div className="form-group">
                <label>
                  <DollarSign size={16} />
                  {t('freight.rate')}
                </label>
                <input
                  type="number"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  placeholder="2500"
                  required
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>{t('freight.loadDescription')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('freight.descriptionPlaceholder')}
                rows="3"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>{t('freight.contactInfo')}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('freight.companyName')}</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('freight.contactName')}</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('freight.phoneNumber')}</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('freight.emailAddress')}</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('freight.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('freight.postLoadBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostLoadModal; 