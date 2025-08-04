#!/usr/bin/env node

/**
 * EW Logistics SEO 优化脚本
 * 用于生成预渲染页面、sitemap 和执行 SEO 检查
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const DOMAIN = 'https://www.ewltl.com';
const BUILD_DIR = './frontend/build';
const OUTPUT_DIR = './seo-output';

// 重要页面列表
const IMPORTANT_PAGES = [
  '/',
  '/forum-logistics-driver-community-freight-talk-物流卡车司机论坛交流平台-经验分享与行业资讯讨论区',
  '/sea-freight-logistics-container-shipping-platform-国际海运集装箱物流平台-船期运费查询与货代服务',
  '/air-platform-logistics-airfreight-shipping-rates-国际空运物流平台-货运报价与航班信息查询系统',
  '/yellow-pages-logistics-supplier-directory-物流企业服务商黄页-货运卡车租赁公司查询平台',
  '/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统',
  '/logistics-truck-rental-fleet-platform-美国货运物流租车系统-卡车货车设备租赁服务信息平台',
  '/freight-calculator-logistics-shipping-estimator-tool-物流计算工具-美国物流等级class计算与换算平台',
  '/contact'
];

class SEOOptimizer {
  constructor() {
    this.browser = null;
  }

  async init() {
    console.log('🚀 启动 SEO 优化器...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // 创建输出目录
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // 预渲染重要页面
  async prerenderPages() {
    console.log('📄 开始预渲染页面...');
    
    const page = await this.browser.newPage();
    
    for (const pagePath of IMPORTANT_PAGES) {
      try {
        console.log(`渲染页面: ${pagePath}`);
        
        const url = `${DOMAIN}${pagePath}`;
        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
        
        // 等待React应用完全加载
        await page.waitForSelector('#root', { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        // 获取完整的HTML内容
        const html = await page.content();
        
        // 生成文件名
        const fileName = pagePath === '/' ? 'index' : pagePath.replace(/\//g, '_');
        const filePath = path.join(OUTPUT_DIR, `${fileName}.html`);
        
        // 保存预渲染的HTML
        await fs.writeFile(filePath, html, 'utf8');
        console.log(`✅ 保存: ${filePath}`);
        
      } catch (error) {
        console.error(`❌ 渲染失败 ${pagePath}:`, error.message);
      }
    }
    
    await page.close();
  }

  // 生成增强版sitemap
  async generateEnhancedSitemap() {
    console.log('🗺️  生成增强版 sitemap...');
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- 首页 - 最高优先级 -->
  <url>
    <loc>${DOMAIN}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
    <mobile:mobile/>
  </url>
  
  <!-- 主要服务页面 -->
  ${IMPORTANT_PAGES.slice(1).map(page => `
  <url>
    <loc>${DOMAIN}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
    <mobile:mobile/>
  </url>`).join('')}
  
</urlset>`;

    const sitemapPath = path.join(OUTPUT_DIR, 'sitemap.xml');
    await fs.writeFile(sitemapPath, sitemap, 'utf8');
    console.log(`✅ Sitemap 保存到: ${sitemapPath}`);
  }

  // 生成robots.txt
  async generateRobotsTxt() {
    console.log('🤖 生成 robots.txt...');
    
    const robots = `User-agent: *
Allow: /

# 主要页面
Allow: /forum-logistics-driver-community-freight-talk-*
Allow: /sea-freight-logistics-container-shipping-platform-*
Allow: /air-platform-logistics-airfreight-shipping-rates-*
Allow: /yellow-pages-logistics-supplier-directory-*
Allow: /jobs-driver-freight-logistics-recruitment-platform-*
Allow: /logistics-truck-rental-fleet-platform-*
Allow: /freight-calculator-logistics-shipping-estimator-tool-*

# 不允许爬取的页面
Disallow: /login
Disallow: /register
Disallow: /profile
Disallow: /admin
Disallow: /api/

# Sitemap 位置
Sitemap: ${DOMAIN}/sitemap.xml

# 爬取延迟 (防止服务器过载)
Crawl-delay: 1`;

    const robotsPath = path.join(OUTPUT_DIR, 'robots.txt');
    await fs.writeFile(robotsPath, robots, 'utf8');
    console.log(`✅ Robots.txt 保存到: ${robotsPath}`);
  }

  // SEO 检查
  async performSEOAudit() {
    console.log('🔍 执行 SEO 审核...');
    
    const page = await this.browser.newPage();
    const results = [];
    
    for (const pagePath of IMPORTANT_PAGES.slice(0, 3)) { // 只检查前3个页面
      try {
        const url = `${DOMAIN}${pagePath}`;
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        // 检查基本SEO元素
        const seoData = await page.evaluate(() => {
          return {
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || '',
            keywords: document.querySelector('meta[name="keywords"]')?.content || '',
            h1: document.querySelector('h1')?.textContent || '',
            h2Count: document.querySelectorAll('h2').length,
            imgWithoutAlt: document.querySelectorAll('img:not([alt])').length,
            internalLinks: document.querySelectorAll('a[href^="/"]').length,
            externalLinks: document.querySelectorAll('a[href^="http"]:not([href*="ewltl.com"])').length
          };
        });
        
        results.push({
          url: pagePath,
          ...seoData
        });
        
      } catch (error) {
        console.error(`SEO审核失败 ${pagePath}:`, error.message);
      }
    }
    
    // 保存审核结果
    const auditPath = path.join(OUTPUT_DIR, 'seo-audit.json');
    await fs.writeFile(auditPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`✅ SEO审核结果保存到: ${auditPath}`);
    
    await page.close();
    return results;
  }

  // 生成Google Search Console提交脚本
  async generateSubmissionScript() {
    console.log('📨 生成提交脚本...');
    
    const script = `#!/bin/bash

# EW Logistics - Google Search Console 提交脚本

echo "🔍 提交网站到 Google Search Console..."

# 1. 使用 curl 请求首页，触发爬虫
echo "触发首页爬取..."
curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "${DOMAIN}/"

# 2. 提交 sitemap
echo "提交 sitemap..."
curl -X POST "https://www.google.com/ping?sitemap=${DOMAIN}/sitemap.xml"

# 3. 主要页面单独提交
echo "提交重要页面..."
${IMPORTANT_PAGES.map(page => 
  `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "${DOMAIN}${page}"`
).join('\n')}

echo "✅ 提交完成！"
echo "请访问 https://search.google.com/search-console 查看索引状态"`;

    const scriptPath = path.join(OUTPUT_DIR, 'submit-to-google.sh');
    await fs.writeFile(scriptPath, script, 'utf8');
    await fs.chmod(scriptPath, '755'); // 设置执行权限
    console.log(`✅ 提交脚本保存到: ${scriptPath}`);
  }

  // 主要执行函数
  async run() {
    try {
      await this.init();
      
      await this.prerenderPages();
      await this.generateEnhancedSitemap();
      await this.generateRobotsTxt();
      await this.performSEOAudit();
      await this.generateSubmissionScript();
      
      console.log('🎉 SEO 优化完成！');
      console.log(`📁 输出目录: ${OUTPUT_DIR}`);
      console.log('📋 后续步骤:');
      console.log('   1. 将 sitemap.xml 和 robots.txt 复制到网站根目录');
      console.log('   2. 在 Google Search Console 中验证网站所有权');
      console.log('   3. 提交 sitemap 到 Google Search Console');
      console.log('   4. 运行 submit-to-google.sh 脚本');
      
    } catch (error) {
      console.error('❌ SEO优化失败:', error);
    } finally {
      await this.close();
    }
  }
}

// 运行优化器
if (require.main === module) {
  const optimizer = new SEOOptimizer();
  optimizer.run().catch(console.error);
}

module.exports = SEOOptimizer; 