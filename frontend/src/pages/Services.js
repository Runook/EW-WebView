import React from 'react';
import { Link } from 'react-router-dom';
import { Ship, Truck, Package, Plane, Navigation, BookOpen, Briefcase, ShoppingBag, CheckCircle } from 'lucide-react';
import './Services.css';

const Services = () => {
  const services = [
    {
      icon: <Truck size={48} />,
      title: '陆运平台',
      subtitle: '货源车源信息平台',
      description: '货主发布货源信息，承运商发布车源信息，通过平台实现智能匹配，提供陆运物流信息服务。',
      features: [
        '货源信息发布',
        '车源信息查询',
        '在线竞价匹配',
        '运输合同管理',
        '物流跟踪服务',
        '信用评价体系'
      ],
      pricing: '信息发布免费',
      link: '/freight-board'
    },
    {
      icon: <Ship size={48} />,
      title: '海运平台',
      subtitle: '海运信息发布平台',
      description: '海运货代、船公司发布舱位信息，货主发布货源需求，提供海运物流信息匹配服务。',
      features: [
        '舱位信息发布',
        '货源需求发布',
        '海运代理查询',
        '港口信息查询',
        '海运费用查询',
        '船期信息更新'
      ],
      pricing: '平台使用免费',
      link: '/sea-freight'
    },
    {
      icon: <Plane size={48} />,
      title: '空运平台',
      subtitle: '航空货运信息平台',
      description: '航空货运代理发布服务信息，货主发布空运需求，提供快速的空运物流信息对接。',
      features: [
        '航班舱位发布',
        '紧急货运需求',
        '空运代理服务',
        '机场信息查询',
        '空运价格查询',
        '特殊货物服务'
      ],
      pricing: '基础功能免费',
      link: '/air-freight'
    },
    {
      icon: <Navigation size={48} />,
      title: '多式联运',
      subtitle: '综合物流信息平台',
      description: '整合海陆空物流资源，提供多式联运解决方案信息发布和查询服务。',
      features: [
        '联运方案发布',
        '多式联运需求',
        '综合服务商查询',
        '路径规划服务',
        '成本分析工具',
        '方案对比功能'
      ],
      pricing: '方案查询免费',
      link: '/multimodal'
    },
    {
      icon: <Package size={48} />,
      title: '一件代发',
      subtitle: '代发服务对接平台',
      description: '电商卖家发布代发需求，代发服务商发布服务信息，实现精准的供需对接。',
      features: [
        '代发服务发布',
        '商品需求发布',
        '服务商资质认证',
        '价格对比功能',
        '服务评价系统',
        '合作协议模板'
      ],
      pricing: '信息查询免费',
      link: '/dropshipping'
    },
    {
      icon: <BookOpen size={48} />,
      title: '商家黄页',
      subtitle: '物流企业目录平台',
      description: '物流行业企业信息发布平台，提供全面的物流服务商查询和企业展示服务。',
      features: [
        '企业信息发布',
        '服务能力展示',
        '资质证书认证',
        '客户评价展示',
        '业务范围查询',
        '联系方式管理'
      ],
      pricing: '基础展示免费',
      link: '/business-directory'
    },
    {
      icon: <Briefcase size={48} />,
      title: '招聘求职',
      subtitle: '物流行业招聘平台',
      description: '物流企业发布招聘信息，求职者发布简历信息，提供精准的人才匹配服务。',
      features: [
        '职位信息发布',
        '简历在线投递',
        '企业直聘功能',
        '薪酬水平查询',
        '职业技能认证',
        '面试预约系统'
      ],
      pricing: '求职免费',
      link: '/jobs'
    },
    {
      icon: <ShoppingBag size={48} />,
      title: '物流租售',
      subtitle: '设备租赁交易平台',
      description: '物流设备拥有者发布租赁信息，需求方发布租赁需求，提供设备租售撮合服务。',
      features: [
        '设备信息发布',
        '租赁需求发布',
        '在线交易撮合',
        '设备状态管理',
        '租赁合同模板',
        '交易担保服务'
      ],
      pricing: '信息发布免费',
      link: '/equipment-rental'
    }
  ];

  return (
    <div className="services">
      <div className="container">
        {/* Header */}
        <div className="services-header">
          <h1 className="services-title">平台服务</h1>
          <p className="services-description">
            东西方物流B2B平台为物流行业各参与方提供信息发布、需求匹配、交易撮合的专业服务，
            连接货主、承运商、物流服务商，打造透明高效的物流信息交易生态圈。
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
                  <span className="pricing-label">参考价格:</span>
                  <span className="pricing-value">{service.pricing}</span>
                </div>
                
                <Link to={service.link} className="btn btn-primary service-btn">
                  进入平台
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="services-cta">
          <h2 className="cta-title">立即加入我们的平台</h2>
          <p className="cta-description">
            免费注册成为平台用户，发布您的需求信息或服务信息，让更多商机找到您
          </p>
          <div className="cta-actions">
            <button className="btn btn-primary">免费注册平台</button>
            <button className="btn btn-secondary">了解平台规则</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services; 