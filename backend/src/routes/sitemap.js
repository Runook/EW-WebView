const express = require('express');
const { db } = require('../config/database');
const router = express.Router();

const SITE_URL = 'https://welogx.com';

function slugify(parts) {
  return parts.filter(Boolean).join('-').replace(/\s+/g, '-').replace(/[\/\\?&#%]+/g, '').toLowerCase();
}

router.get('/jobs.xml', async (req, res) => {
  try {
    const jobs = await db('jobs')
      .select('id', 'title', 'company', 'location', 'updated_at')
      .where('is_active', true)
      .orderBy('created_at', 'desc')
      .limit(5000);

    const resumes = await db('resumes')
      .select('id', 'position', 'location', 'experience', 'updated_at')
      .where('is_active', true)
      .orderBy('created_at', 'desc')
      .limit(5000);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Jobs listing page
    xml += `  <url>\n    <loc>${SITE_URL}/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

    for (const job of jobs) {
      const slug = slugify([job.title, job.company, job.location]);
      const lastmod = job.updated_at ? new Date(job.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${SITE_URL}/job/${job.id}/${encodeURI(slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    for (const resume of resumes) {
      const slug = slugify([resume.position, resume.location, resume.experience]);
      const lastmod = resume.updated_at ? new Date(resume.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${SITE_URL}/resume/${resume.id}/${encodeURI(slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

module.exports = router;
