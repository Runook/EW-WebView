import React, { useState } from 'react';
import { X, MapPin, Truck, Calendar, DollarSign, Navigation } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Modal.css';

const PostTruckModal = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    currentLocation: '',
    preferredOrigin: '',
    preferredDestination: '',
    availableDate: '',
    equipment: '',
    capacity: '',
    length: '',
    preferredRate: '',
    radius: '',
    specialRequirements: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    companyName: '',
    truckNumber: '',
    driverName: ''
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
      type: 'truck',
      postedDate: new Date().toISOString()
    });
    setFormData({
      currentLocation: '',
      preferredOrigin: '',
      preferredDestination: '',
      availableDate: '',
      equipment: '',
      capacity: '',
      length: '',
      preferredRate: '',
      radius: '',
      specialRequirements: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      companyName: '',
      truckNumber: '',
      driverName: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('freight.postTruck')}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h3>{t('freight.truckInfo')}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  {t('freight.currentLocation')}
                </label>
                <input
                  type="text"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleChange}
                  placeholder={t('freight.currentLocation')}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  {t('freight.availableDate')}
                </label>
                <input
                  type="date"
                  name="availableDate"
                  value={formData.availableDate}
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
                  <Truck size={16} />
                  {t('freight.capacity')}
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="80000"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Truck size={16} />
                  {t('freight.length')}
                </label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  placeholder="53"
                />
              </div>

              <div className="form-group">
                <label>
                  <Navigation size={16} />
                  {t('freight.searchRadius')}
                </label>
                <input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleChange}
                  placeholder="500"
                />
              </div>

              <div className="form-group">
                <label>{t('freight.truckNumber')}</label>
                <input
                  type="text"
                  name="truckNumber"
                  value={formData.truckNumber}
                  onChange={handleChange}
                  placeholder="T-1001"
                />
              </div>

              <div className="form-group">
                <label>{t('freight.driverName')}</label>
                <input
                  type="text"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>{t('freight.preferredRoutes')}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  {t('freight.preferredOrigin')}
                </label>
                <input
                  type="text"
                  name="preferredOrigin"
                  value={formData.preferredOrigin}
                  onChange={handleChange}
                  placeholder={t('freight.optional')}
                />
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  {t('freight.preferredDestination')}
                </label>
                <input
                  type="text"
                  name="preferredDestination"
                  value={formData.preferredDestination}
                  onChange={handleChange}
                  placeholder={t('freight.optional')}
                />
              </div>

              <div className="form-group">
                <label>
                  <DollarSign size={16} />
                  {t('freight.preferredRate')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="preferredRate"
                  value={formData.preferredRate}
                  onChange={handleChange}
                  placeholder="2.50"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>{t('freight.specialRequirements')}</label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleChange}
                placeholder={t('freight.specialReqPlaceholder')}
                rows="3"
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
              {t('freight.postTruckBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostTruckModal; 