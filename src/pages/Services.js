import React from 'react';
import { Ship, Truck, Package, Warehouse, Plane, MapPin, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Services.css';

const Services = () => {
  const { t } = useLanguage();

  const services = [
    {
      icon: <Ship size={48} />,
      title: t('home.services.oceanFreight'),
      subtitle: t('services.oceanFreight.subtitle'),
      description: t('services.oceanFreight.description'),
      features: [
        t('services.oceanFreight.features.fcl'),
        t('services.oceanFreight.features.lcl'),
        t('services.oceanFreight.features.portTrucking'),
        t('services.oceanFreight.features.customs'),
        t('services.oceanFreight.features.doorToDoor'),
        t('services.oceanFreight.features.tracking')
      ],
      pricing: t('services.oceanFreight.pricing')
    },
    {
      icon: <Truck size={48} />,
      title: t('home.services.truckLoads'),
      subtitle: t('services.truckLoads.subtitle'),
      description: t('services.truckLoads.description'),
      features: [
        t('services.truckLoads.features.ftl'),
        t('services.truckLoads.features.ltl'),
        t('services.truckLoads.features.temperature'),
        t('services.truckLoads.features.expedited'),
        t('services.truckLoads.features.crossDocking'),
        t('services.truckLoads.features.liveTracking')
      ],
      pricing: t('services.truckLoads.pricing')
    },
    {
      icon: <Package size={48} />,
      title: t('home.services.fbaShipping'),
      subtitle: t('services.fbaShipping.subtitle'),
      description: t('services.fbaShipping.description'),
      features: [
        t('services.fbaShipping.features.prep'),
        t('services.fbaShipping.features.labeling'),
        t('services.fbaShipping.features.compliance'),
        t('services.fbaShipping.features.multiChannel'),
        t('services.fbaShipping.features.inventory'),
        t('services.fbaShipping.features.returns')
      ],
      pricing: t('services.fbaShipping.pricing')
    },
    {
      icon: <Warehouse size={48} />,
      title: t('home.services.warehousing'),
      subtitle: t('services.warehousing.subtitle'),
      description: t('services.warehousing.description'),
      features: [
        t('services.warehousing.features.climateControlled'),
        t('services.warehousing.features.inventory'),
        t('services.warehousing.features.pickPack'),
        t('services.warehousing.features.transloading'),
        t('services.warehousing.features.crossDocking'),
        t('services.warehousing.features.sameDayProcessing')
      ],
      pricing: t('services.warehousing.pricing')
    },
    {
      icon: <Plane size={48} />,
      title: t('services.airFreight.title'),
      subtitle: t('services.airFreight.subtitle'),
      description: t('services.airFreight.description'),
      features: [
        t('services.airFreight.features.express'),
        t('services.airFreight.features.international'),
        t('services.airFreight.features.expedited'),
        t('services.airFreight.features.dangerous'),
        t('services.airFreight.features.charter'),
        t('services.airFreight.features.realtime')
      ],
      pricing: t('services.airFreight.pricing')
    },
    {
      icon: <MapPin size={48} />,
      title: t('services.lastMile.title'),
      subtitle: t('services.lastMile.subtitle'),
      description: t('services.lastMile.description'),
      features: [
        t('services.lastMile.features.sameDay'),
        t('services.lastMile.features.scheduled'),
        t('services.lastMile.features.whiteGlove'),
        t('services.lastMile.features.installation'),
        t('services.lastMile.features.proofDelivery'),
        t('services.lastMile.features.notifications')
      ],
      pricing: t('services.lastMile.pricing')
    }
  ];

  return (
    <div className="services">
      <div className="container">
        {/* Header */}
        <div className="services-header">
          <h1 className="services-title">{t('services.title')}</h1>
          <p className="services-description">
            {t('services.description')}
          </p>
        </div>

        {/* Services Grid */}
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon">
                {service.icon}
              </div>
              
              <div className="service-content">
                <h3 className="service-title">{service.title}</h3>
                <p className="service-subtitle">{service.subtitle}</p>
                <p className="service-description">{service.description}</p>
                
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="service-feature">
                      <CheckCircle size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="service-pricing">
                  <span className="pricing-label">{t('services.pricing')}:</span>
                  <span className="pricing-value">{service.pricing}</span>
                </div>
                
                <button className="btn btn-primary service-btn">
                  {t('services.getQuote')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="services-cta">
          <h2 className="cta-title">{t('services.cta.title')}</h2>
          <p className="cta-description">
            {t('services.cta.description')}
          </p>
          <div className="cta-actions">
            <button className="btn btn-primary">{t('services.cta.contactTeam')}</button>
            <button className="btn btn-secondary">{t('services.cta.schedule')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services; 