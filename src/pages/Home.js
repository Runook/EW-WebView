import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Ship, 
  Package, 
  Warehouse, 
  ArrowRight, 
  CheckCircle,
  Users,
  Globe,
  Clock,
  Shield
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Home.css';

const Home = () => {
  const { t } = useLanguage();

  const services = [
    {
      icon: <Ship size={32} />,
      title: t('home.services.oceanFreight'),
      description: t('home.services.oceanFreightDesc'),
      features: [
        t('services.oceanFreight.features.fcl'),
        t('services.oceanFreight.features.lcl'),
        t('services.oceanFreight.features.portTrucking')
      ]
    },
    {
      icon: <Truck size={32} />,
      title: t('home.services.truckLoads'),
      description: t('home.services.truckLoadsDesc'),
      features: [
        t('services.truckLoads.features.ftl'),
        t('services.truckLoads.features.ltl'),
        t('services.truckLoads.features.expedited')
      ]
    },
    {
      icon: <Package size={32} />,
      title: t('home.services.fbaShipping'),
      description: t('home.services.fbaShippingDesc'),
      features: [
        t('services.fbaShipping.features.prep'),
        t('services.fbaShipping.features.compliance'),
        t('services.lastMile.features.sameDay')
      ]
    },
    {
      icon: <Warehouse size={32} />,
      title: t('home.services.warehousing'),
      description: t('home.services.warehousingDesc'),
      features: [
        t('services.warehousing.features.climateControlled'),
        t('services.warehousing.features.transloading'),
        t('services.warehousing.features.crossDocking')
      ]
    }
  ];

  const stats = [
    { icon: <Users size={24} />, number: '10,000+', label: t('home.stats.customers') },
    { icon: <Globe size={24} />, number: '50+', label: t('home.stats.countries') },
    { icon: <Clock size={24} />, number: '24/7', label: t('home.stats.support') },
    { icon: <Shield size={24} />, number: '99.9%', label: t('home.stats.delivery') }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                {t('home.title')}
                <span className="text-green">{t('home.titleHighlight')}</span>
              </h1>
              <p className="hero-description">
                {t('home.description')}
              </p>
              <div className="hero-actions">
                <Link to="/freight-board" className="btn btn-primary">
                  {t('home.findFreight')}
                  <ArrowRight size={20} />
                </Link>
                <Link to="/services" className="btn btn-secondary">
                  {t('home.ourServices')}
                </Link>
              </div>
              <div className="hero-features">
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>{t('home.realTimeTracking')}</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>{t('home.competitiveRates')}</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>{t('home.support247')}</span>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-graphic">
                <div className="floating-card card-1">
                  <Truck size={24} />
                  <span>整车/零担</span>
                </div>
                <div className="floating-card card-2">
                  <Ship size={24} />
                  <span>海运</span>
                </div>
                <div className="floating-card card-3">
                  <Package size={24} />
                  <span>FBA配送</span>
                </div>
                <div className="floating-card card-4">
                  <Warehouse size={24} />
                  <span>仓储</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-icon">
                  {stat.icon}
                </div>
                <div className="stat-content">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('home.services.title')}</h2>
            <p className="section-description">
              {t('home.services.description')}
            </p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">
                  {service.icon}
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="service-feature">
                      <CheckCircle size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/services" className="service-link">
                  {t('home.services.learnMore')}
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">{t('home.cta.title')}</h2>
            <p className="cta-description">
              {t('home.cta.description')}
            </p>
            <div className="cta-actions">
              <Link to="/freight-board" className="btn btn-primary">
                {t('home.cta.getStarted')}
                <ArrowRight size={20} />
              </Link>
              <button className="btn btn-ghost">
                {t('home.cta.contactSales')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 