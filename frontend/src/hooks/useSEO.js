import { useEffect } from 'react';

/**
 * 动态SEO管理Hook
 * 用于为React页面动态设置SEO标签
 * 
 * @param {Object} seoData - SEO数据对象
 * @param {string} seoData.title - 页面标题
 * @param {string} seoData.description - 页面描述
 * @param {string} seoData.keywords - 关键词 (可选)
 * @param {string} seoData.image - 社交分享图片 (可选)
 * @param {string} seoData.url - 页面URL (可选)
 * @param {Object} seoData.structuredData - 结构化数据 (可选)
 */
export const useSEO = ({
  title,
  description,
  keywords,
  image,
  url,
  structuredData
}) => {
  useEffect(() => {
    // 保存原始标题（清理时恢复）
    const originalTitle = document.title;

    // 1. 更新页面标题
    if (title) {
      document.title = title;
    }

    // 2. 更新meta描述
    const updateOrCreateMeta = (name, content) => {
      if (!content) return;
      
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 3. 更新Open Graph标签
    const updateOrCreateOGMeta = (property, content) => {
      if (!content) return;
      
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 更新基本meta标签
    updateOrCreateMeta('description', description);
    updateOrCreateMeta('keywords', keywords);

    // 更新Open Graph标签
    updateOrCreateOGMeta('og:title', title);
    updateOrCreateOGMeta('og:description', description);
    updateOrCreateOGMeta('og:image', image || 'https://welogx.com/logo.png');
    updateOrCreateOGMeta('og:url', url || window.location.href);

    // 更新Twitter标签
    updateOrCreateMeta('twitter:title', title);
    updateOrCreateMeta('twitter:description', description);
    updateOrCreateMeta('twitter:image', image || 'https://welogx.com/logo.png');

    // 4. 添加结构化数据
    let structuredDataScript;
    if (structuredData) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.type = 'application/ld+json';
      structuredDataScript.innerHTML = JSON.stringify(structuredData);
      document.head.appendChild(structuredDataScript);
    }

    // 5. 更新canonical链接
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (url) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', url);
    }

    // 清理函数
    return () => {
      // 恢复原始标题
      document.title = originalTitle;
      
      // 移除结构化数据脚本
      if (structuredDataScript && structuredDataScript.parentNode) {
        structuredDataScript.parentNode.removeChild(structuredDataScript);
      }
    };
  }, [title, description, keywords, image, url, structuredData]);
};

/**
 * 预定义的SEO配置
 */
export const SEO_CONFIGS = {
  HOME: {
    title: "Welogx物流平台 - 专业的美国物流运输服务平台 | welogx.com",
    description: "Welogx物流平台(welogx.com)是专业的美国物流运输服务平台，提供陆运、海运、空运、多式联运等一站式物流解决方案。包含货运计算器、物流黄页、司机招聘、设备租赁等全方位物流服务。",
    keywords: "美国物流,货运平台,陆运服务,海运集装箱,空运物流,物流计算器,货运招聘,物流设备租赁,物流黄页,美国货运,国际物流,welogx,Welogx",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "WELOGX TECHNOLOGY INC",
      "alternateName": "Welogx物流平台",
      "url": "https://welogx.com",
      "logo": "https://welogx.com/logo.png",
      "description": "专业的美国物流运输服务平台，提供陆运、海运、空运、多式联运等一站式物流解决方案",
      "sameAs": [
        "https://welogx.com"
      ]
    }
  },

  FREIGHT_BOARD: {
    title: "美国陆运货源车源平台 - Welogx | 专业货运信息匹配服务",
    description: "Welogx陆运平台提供全美货源车源信息，FTL整车运输，LTL零担物流，实时货运匹配，专业物流解决方案。立即发布您的货源或车源信息！",
    keywords: "美国陆运,货源信息,车源平台,FTL运输,LTL物流,货运匹配,物流司机,货车运输,ewltl陆运",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Welogx陆运服务",
      "description": "专业的美国陆运物流服务，提供货源车源匹配",
      "provider": {
        "@type": "Organization",
        "name": "WELOGX TECHNOLOGY INC",
        "url": "https://welogx.com"
      },
      "areaServed": "United States",
      "serviceType": "陆运物流服务"
    }
  },

  SEA_FREIGHT: {
    title: "国际海运集装箱物流平台 - Welogx | 船期运费查询服务",
    description: "Welogx海运平台提供国际海运集装箱服务，船期查询，运费报价，货代服务。专业的海运物流解决方案，覆盖全球主要港口。",
    keywords: "国际海运,集装箱运输,船期查询,海运运费,货代服务,国际物流,海运平台,ewltl海运",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Welogx海运服务",
      "description": "专业的国际海运集装箱物流服务",
      "provider": {
        "@type": "Organization",
        "name": "WELOGX TECHNOLOGY INC",
        "url": "https://welogx.com"
      },
      "areaServed": "Worldwide",
      "serviceType": "海运物流服务"
    }
  },

  AIR_FREIGHT: {
    title: "国际空运物流平台 - Welogx | 货运报价与航班信息查询",
    description: "Welogx空运平台提供国际空运服务，航班信息查询，空运报价，紧急货运。专业的空运物流解决方案，快速可靠的国际运输服务。",
    keywords: "国际空运,航空运输,空运报价,航班信息,紧急货运,国际快递,空运物流,ewltl空运",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Welogx空运服务",
      "description": "专业的国际空运物流服务",
      "provider": {
        "@type": "Organization",
        "name": "WELOGX TECHNOLOGY INC",
        "url": "https://welogx.com"
      },
      "areaServed": "Worldwide",
      "serviceType": "空运物流服务"
    }
  },

  YELLOW_PAGES: {
    title: "物流企业服务商黄页 - Welogx | 货运卡车租赁公司查询平台",
    description: "Welogx黄页平台提供全美物流企业信息查询，货运公司目录，卡车租赁服务商，物流设备供应商。找物流服务商就上welogx.com！",
    keywords: "物流黄页,物流企业,货运公司,卡车租赁,物流设备,服务商目录,物流供应商,ewltl黄页",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "物流企业服务商目录",
      "description": "全美物流企业和服务商信息目录",
      "provider": {
        "@type": "Organization",
        "name": "WELOGX TECHNOLOGY INC",
        "url": "https://welogx.com"
      }
    }
  },

  JOBS: {
    title: "物流司机招聘求职平台 - Welogx | 货运卡车运输人才匹配系统",
    description: "Welogx招聘平台提供物流司机求职招聘，货运工作机会，卡车司机职位发布。专业的物流行业人才匹配平台，找工作就上welogx.com！",
    keywords: "物流招聘,司机求职,货运工作,卡车司机,物流人才,运输招聘,物流职位,ewltl招聘",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "WELOGX TECHNOLOGY INC",
        "url": "https://welogx.com"
      },
      "description": "物流行业招聘求职平台",
      "industry": "物流运输"
    }
  }
};

/**
 * 便捷的预定义SEO Hook
 */
export const useHomeSEO = () => useSEO(SEO_CONFIGS.HOME);
export const useFreightBoardSEO = () => useSEO(SEO_CONFIGS.FREIGHT_BOARD);
export const useSeaFreightSEO = () => useSEO(SEO_CONFIGS.SEA_FREIGHT);
export const useAirFreightSEO = () => useSEO(SEO_CONFIGS.AIR_FREIGHT);
export const useYellowPagesSEO = () => useSEO(SEO_CONFIGS.YELLOW_PAGES);
export const useJobsSEO = () => useSEO(SEO_CONFIGS.JOBS); 