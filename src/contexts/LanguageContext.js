import React, { createContext, useContext } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  // Header
  'nav.home': '首页',
  'nav.services': '服务',
  'nav.landWarehouse': '陆仓查询',
  'nav.seaportQuery': '海港查询',
  'nav.airportQuery': '机场查询',
  'nav.contact': '联系我们',
  'header.liveChat': '在线客服',
  'header.callNow': '立即拨打',
  'logo.main': '东西方物流',
  'logo.sub': 'EW Logistics',

  // Home Page
  'home.title': '现代化物流',
  'home.titleHighlight': '解决方案',
  'home.description': '东西方物流平台通过尖端技术连接托运人和承运人。从海运到最后一公里配送，我们为您的业务需求提供全面的物流解决方案。',
  'home.findFreight': '寻找货物',
  'home.ourServices': '我们的服务',
  'home.realTimeTracking': '实时跟踪',
  'home.competitiveRates': '竞争性价格',
  'home.support247': '24/7支持',
  'home.stats.customers': '满意客户',
  'home.stats.countries': '服务国家',
  'home.stats.support': '客户支持',
  'home.stats.delivery': '准时交付',
  'home.services.title': '我们的服务',
  'home.services.description': '通过行业领先的技术和卓越的客户服务，为您的业务需求设计全面的物流解决方案。',
  'home.services.oceanFreight': '海运',
  'home.services.oceanFreightDesc': '整箱货运(FCL)、拼箱货运(LCL)、港口卡车运输和货运代理',
  'home.services.truckLoads': '卡车运输',
  'home.services.truckLoadsDesc': '整车运输(FTL)和零担运输(LTL)',
  'home.services.fbaShipping': 'FBA配送',
  'home.services.fbaShippingDesc': '亚马逊配送服务和电商解决方案',
  'home.services.warehousing': '仓储',
  'home.services.warehousingDesc': '存储、转运和配送服务',
  'home.services.learnMore': '了解更多',
  'home.cta.title': '准备发货？',
  'home.cta.description': '加入使用我们平台的数千家托运人和承运人',
  'home.cta.getStarted': '开始使用',
  'home.cta.contactSales': '联系销售',

  // Freight Board
  'freight.title': '货运板',
  'freight.description': '通过我们先进的货运匹配平台连接托运人和承运人',
  'freight.availableLoads': '可用货物',
  'freight.availableTrucks': '可用卡车',
  'freight.search': '按城市、州或公司搜索...',
  'freight.origin': '起点',
  'freight.destination': '终点',
  'freight.equipment': '设备类型',
  'freight.allTypes': '所有类型',
  'freight.applyFilters': '应用筛选',
  'freight.loadsAvailable': '个可用货物',
  'freight.trucksAvailable': '辆可用卡车',
  'freight.sortRate': '按费率排序',
  'freight.sortDate': '按提货日期排序',
  'freight.sortMiles': '按里程排序',
  'freight.pickup': '提货',
  'freight.delivery': '交付',
  'freight.available': '可用',
  'freight.preferredLanes': '首选路线',
  'freight.message': '消息',
  'freight.postLoad': '发布货物',
  'freight.postTruck': '发布卡车',

  // Post Load Modal
  'freight.loadInfo': '货物信息',
  'freight.pickupDate': '提货日期',
  'freight.deliveryDate': '交付日期',
  'freight.weight': '重量(lbs)',
  'freight.length': '长度(ft)',
  'freight.rate': '费率($)',
  'freight.loadDescription': '货物描述',
  'freight.descriptionPlaceholder': '描述货物类型、特殊要求...',
  'freight.contactInfo': '联系信息',
  'freight.companyName': '公司名称',
  'freight.contactName': '联系人姓名',
  'freight.phoneNumber': '电话号码',
  'freight.emailAddress': '邮箱地址',
  'freight.cancel': '取消',
  'freight.postLoadBtn': '发布货物',
  'freight.selectEquipment': '选择设备类型',
  'freight.optional': '可选',

  // Post Truck Modal
  'freight.truckInfo': '卡车信息',
  'freight.currentLocation': '当前位置',
  'freight.availableDate': '可用日期',
  'freight.capacity': '容量(lbs)',
  'freight.searchRadius': '搜索半径(miles)',
  'freight.truckNumber': '卡车编号',
  'freight.driverName': '司机姓名',
  'freight.preferredRoutes': '首选路线',
  'freight.preferredOrigin': '首选起点',
  'freight.preferredDestination': '首选终点',
  'freight.preferredRate': '首选费率($/mile)',
  'freight.specialRequirements': '特殊要求',
  'freight.specialReqPlaceholder': '描述任何特殊设备要求、限制...',
  'freight.postTruckBtn': '发布卡车',

  // Services
  'services.title': '我们的服务',
  'services.description': '通过行业领先的技术和卓越的客户服务，为您的业务需求设计全面的物流解决方案。',
  'services.getQuote': '获取报价',
  'services.pricing': '价格',
  'services.cta.title': '需要定制解决方案？',
  'services.cta.description': '我们的物流专家可以为您的特定需求设计定制解决方案。',
  'services.cta.contactTeam': '联系我们的团队',
  'services.cta.schedule': '预约咨询',

  // Ocean Freight
  'services.oceanFreight.subtitle': '整箱货运(FCL)和拼箱货运(LCL)服务',
  'services.oceanFreight.description': '为国际运输提供全面的海运解决方案，包括整箱和拼箱服务。',
  'services.oceanFreight.features.fcl': '整箱货运(FCL)',
  'services.oceanFreight.features.lcl': '拼箱货运(LCL)',
  'services.oceanFreight.features.portTrucking': '港口卡车运输',
  'services.oceanFreight.features.customs': '清关服务',
  'services.oceanFreight.features.doorToDoor': '门到门配送',
  'services.oceanFreight.features.tracking': '实时跟踪',
  'services.oceanFreight.pricing': '起价 ¥8,000/集装箱',

  // Truck Loads
  'services.truckLoads.subtitle': '整车运输(FTL)和零担运输(LTL)解决方案',
  'services.truckLoads.description': '可靠的地面运输服务，覆盖全国范围内的整车运输和零担运输。',
  'services.truckLoads.features.ftl': '整车运输(FTL)',
  'services.truckLoads.features.ltl': '零担运输(LTL)',
  'services.truckLoads.features.temperature': '温控运输',
  'services.truckLoads.features.expedited': '加急服务',
  'services.truckLoads.features.crossDocking': '交叉转运',
  'services.truckLoads.features.liveTracking': '实时跟踪',
  'services.truckLoads.pricing': '起价 ¥10/公里',

  // FBA Shipping
  'services.fbaShipping.subtitle': '亚马逊配送服务',
  'services.fbaShipping.description': '专业的亚马逊FBA准备和配送服务，高效将您的产品送达亚马逊配送中心。',
  'services.fbaShipping.features.prep': 'FBA准备服务',
  'services.fbaShipping.features.labeling': '标签和包装',
  'services.fbaShipping.features.compliance': '亚马逊合规',
  'services.fbaShipping.features.multiChannel': '多渠道支持',
  'services.fbaShipping.features.inventory': '库存管理',
  'services.fbaShipping.features.returns': '退货处理',
  'services.fbaShipping.pricing': '起价 ¥1.5/件',

  // Warehousing
  'services.warehousing.subtitle': '仓储和配送',
  'services.warehousing.description': '安全的仓库设施，具备先进的库存管理和配送能力，满足您的业务需求。',
  'services.warehousing.features.climateControlled': '恒温仓储',
  'services.warehousing.features.inventory': '库存管理',
  'services.warehousing.features.pickPack': '拣货打包服务',
  'services.warehousing.features.transloading': '转运服务',
  'services.warehousing.features.crossDocking': '交叉转运',
  'services.warehousing.features.sameDayProcessing': '当日处理',
  'services.warehousing.pricing': '起价 ¥50/托盘/月',

  // Air Freight
  'services.airFreight.title': '航空货运',
  'services.airFreight.subtitle': '快递配送',
  'services.airFreight.description': '快速可靠的航空货运服务，适用于时效性强的货物，提供全球覆盖和加急处理。',
  'services.airFreight.features.express': '快递航空服务',
  'services.airFreight.features.international': '国际覆盖',
  'services.airFreight.features.expedited': '加急处理',
  'services.airFreight.features.dangerous': '危险品运输',
  'services.airFreight.features.charter': '包机服务',
  'services.airFreight.features.realtime': '实时更新',
  'services.airFreight.pricing': '起价 ¥25/公斤',

  // Last Mile
  'services.lastMile.title': '最后一公里配送',
  'services.lastMile.subtitle': '最终配送',
  'services.lastMile.description': '完整的最后一公里配送解决方案，确保您的产品安全准时送达客户。',
  'services.lastMile.features.sameDay': '当日配送',
  'services.lastMile.features.scheduled': '预约配送',
  'services.lastMile.features.whiteGlove': '白手套服务',
  'services.lastMile.features.installation': '安装服务',
  'services.lastMile.features.proofDelivery': '配送证明',
  'services.lastMile.features.notifications': '客户通知',
  'services.lastMile.pricing': '起价 ¥100/次配送',

  // Contact
  'contact.title': '联系我们',
  'contact.description': '联系我们的物流专家。我们在这里帮助您找到完美的运输解决方案。',
  'contact.getInTouch': '联系我们',
  'contact.ready': '准备发货？我们的团队随时为您提供报价并回答您可能遇到的任何问题。',
  'contact.phone': '电话',
  'contact.email': '邮箱',
  'contact.office': '办公室',
  'contact.workingHours': '工作时间',
  'contact.startChat': '开始在线客服',
  'contact.sendMessage': '发送消息',
  'contact.formDescription': '填写下面的表单，我们将在24小时内回复您。',
  'contact.fullName': '姓名',
  'contact.emailAddress': '邮箱地址',
  'contact.companyName': '公司名称',
  'contact.phoneNumber': '电话号码',
  'contact.serviceInterest': '感兴趣的服务',
  'contact.selectService': '选择服务',
  'contact.message': '消息',
  'contact.messagePlaceholder': '告诉我们您的运输需求...',
  'contact.sendBtn': '发送消息',
  'contact.other': '其他',

  // Footer
  'footer.description': '现代化物流解决方案，通过尖端技术和卓越服务连接托运人和承运人。',
  'footer.quickLinks': '快速链接',
  'footer.services': '服务',
  'footer.legal': '法律和支持',
  'footer.licenses': '许可证和认证：',
  'footer.copyright': '东西方物流服务有限公司。保留所有权利。',
  'footer.privacyPolicy': '隐私政策',
  'footer.termsOfService': '服务条款',
  'footer.cookiePolicy': 'Cookie政策',
  'footer.compliance': '合规',

  // Common
  'common.dryVan': '干货车',
  'common.reefer': '冷藏车',
  'common.flatbed': '平板车',
  'common.stepDeck': '低平板车',
  'common.lowboy': '超低平板车',
  'common.tanker': '油罐车',
};

export const LanguageProvider = ({ children }) => {
  const t = (key) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext; 