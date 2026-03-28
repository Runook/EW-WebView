import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Clock, BookOpen, Calendar, Eye, DollarSign,
  Building2, Phone, Mail, User, Send, Bookmark, BookMarked,
  Briefcase, ChevronRight, Share2, Check
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { useSEO } from '../hooks/useSEO';
import './JobDetail.css';

export function generateJobSlug(job) {
  if (!job) return '';
  const parts = [job.title, job.company, job.location].filter(Boolean);
  return parts.join('-').replace(/\s+/g, '-').replace(/[/\\?&#%]+/g, '').toLowerCase();
}

const SITE_URL = 'https://welogx.com';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('ew_saved_jobs') || '{}')[`job_${id}`]; } catch { return false; }
  });

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.get(`/jobs/${id}`);
      if (result.success) {
        setJob(result.data);
        // Fetch related jobs by same category
        try {
          const related = await apiClient.get('/jobs', { category: result.data.category, limit: 4 });
          if (related.success) {
            setRelatedJobs((related.data || []).filter(j => j.id !== parseInt(id)).slice(0, 3));
          }
        } catch {}
      } else {
        setError('职位不存在');
      }
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  const pageUrl = job ? `${SITE_URL}/job/${job.id}/${generateJobSlug(job)}` : '';

  useSEO({
    title: job ? `${job.title} - ${job.company} | ${job.location}招聘 - Welogx物流招聘` : '职位详情 - Welogx物流招聘',
    description: job ? `${job.company}正在${job.location}招聘${job.title}，薪资${job.salary}，要求${job.experience}。立即申请！${(job.description || '').slice(0, 120)}` : '物流行业招聘信息',
    keywords: job ? `${job.title},${job.company},${job.location}招聘,${job.category},物流招聘,司机招聘,货运工作` : '物流招聘',
    url: pageUrl,
    structuredData: job ? {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      "datePosted": job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : undefined,
      "validThrough": job.createdAt ? new Date(new Date(job.createdAt).getTime() + 90 * 86400000).toISOString().split('T')[0] : undefined,
      "employmentType": job.type === '全职' ? 'FULL_TIME' : job.type === '兼职' ? 'PART_TIME' : job.type === '合同工' ? 'CONTRACTOR' : 'TEMPORARY',
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company,
        "sameAs": SITE_URL
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location,
          "addressCountry": "US"
        }
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": { "@type": "QuantitativeValue", "value": job.salary }
      },
      "experienceRequirements": job.experience,
      "industry": "物流运输 / Logistics & Transportation",
      "occupationalCategory": job.category,
      "url": pageUrl
    } : undefined
  });

  const toggleSave = () => {
    setSaved(prev => {
      const next = !prev;
      try {
        const all = JSON.parse(localStorage.getItem('ew_saved_jobs') || '{}');
        if (next) all[`job_${id}`] = true; else delete all[`job_${id}`];
        localStorage.setItem('ew_saved_jobs', JSON.stringify(all));
      } catch {}
      return next;
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: job.title, text: `${job.title} - ${job.company}`, url: pageUrl }); } catch {}
    } else {
      navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="job-detail-page"><div className="job-detail-loading"><div className="loading-spinner" /><p>加载中...</p></div></div>;
  }

  if (error || !job) {
    return (
      <div className="job-detail-page">
        <div className="job-detail-error">
          <Briefcase size={48} />
          <h2>{error || '职位不存在'}</h2>
          <p>该职位可能已被删除或链接无效</p>
          <button onClick={() => navigate('/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统')}>
            返回招聘大厅
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      {/* Breadcrumbs */}
      <nav className="jd-breadcrumb" aria-label="breadcrumb">
        <Link to="/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统">招聘求职</Link>
        <ChevronRight size={14} />
        {job.category && <><Link to={`/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统?category=${encodeURIComponent(job.category)}`}>{job.category}</Link><ChevronRight size={14} /></>}
        <span>{job.title}</span>
      </nav>

      <div className="jd-layout">
        {/* Main Content */}
        <article className="jd-main">
          <div className="jd-header">
            <div className="jd-company-avatar">{(job.company || '?')[0]}</div>
            <div className="jd-header-info">
              <h1>{job.title}</h1>
              <div className="jd-company-name"><Building2 size={16} /> {job.company}</div>
            </div>
          </div>

          <div className="jd-salary-bar">
            <span className="jd-salary"><DollarSign size={18} /> {job.salary}</span>
          </div>

          <div className="jd-tags">
            <span className="jd-tag location"><MapPin size={14} /> {job.location}</span>
            <span className="jd-tag type"><Clock size={14} /> {job.type}</span>
            <span className="jd-tag exp"><BookOpen size={14} /> {job.experience}</span>
            {job.category && <span className="jd-tag cat"><Briefcase size={14} /> {job.category}</span>}
          </div>

          <div className="jd-meta-bar">
            <span><Eye size={14} /> {job.views} 次查看</span>
            <span><Calendar size={14} /> 发布于 {job.posted}</span>
          </div>

          <section className="jd-section">
            <h2>职位描述</h2>
            <div className="jd-description" style={{ whiteSpace: 'pre-wrap' }}>{job.description}</div>
          </section>

          <section className="jd-section">
            <h2>联系方式</h2>
            <div className="jd-contact-grid">
              {job.contactPerson && <div className="jd-contact-item"><User size={18} /><div><div className="contact-label">联系人</div><div className="contact-value">{job.contactPerson}</div></div></div>}
              {job.contactPhone && <div className="jd-contact-item"><Phone size={18} /><div><div className="contact-label">电话(美国)</div><a href={`tel:${job.contactPhone}`} className="contact-value">{job.contactPhone}</a></div></div>}
              {job.contactPhoneCN && <div className="jd-contact-item"><Phone size={18} /><div><div className="contact-label">电话(中国)</div><div className="contact-value">{job.contactPhoneCN}</div></div></div>}
              {job.contactEmail && <div className="jd-contact-item"><Mail size={18} /><div><div className="contact-label">邮箱</div><a href={`mailto:${job.contactEmail}`} className="contact-value">{job.contactEmail}</a></div></div>}
            </div>
          </section>

          <div className="jd-action-bar">
            <button className="jd-btn primary" onClick={() => job.contactEmail ? window.location.href = `mailto:${job.contactEmail}?subject=申请${job.title}职位` : null}>
              <Send size={16} /> 立即申请
            </button>
            <button className={`jd-btn ${saved ? 'saved' : 'secondary'}`} onClick={toggleSave}>
              {saved ? <BookMarked size={16} /> : <Bookmark size={16} />}
              {saved ? '已收藏' : '收藏'}
            </button>
            <button className="jd-btn secondary" onClick={handleShare}>
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? '已复制' : '分享'}
            </button>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="jd-sidebar">
          {/* Company Card */}
          <div className="jd-sidebar-card">
            <h3>公司信息</h3>
            <div className="jd-sidebar-company">
              <div className="jd-company-avatar-sm">{(job.company || '?')[0]}</div>
              <div>
                <div className="jd-sidebar-company-name">{job.company}</div>
                <div className="jd-sidebar-company-loc"><MapPin size={12} /> {job.location}</div>
              </div>
            </div>
          </div>

          {/* Job Summary Card */}
          <div className="jd-sidebar-card">
            <h3>职位概要</h3>
            <div className="jd-summary-list">
              <div className="jd-summary-item"><span className="summary-label">职位类型</span><span className="summary-value">{job.type}</span></div>
              <div className="jd-summary-item"><span className="summary-label">经验要求</span><span className="summary-value">{job.experience}</span></div>
              <div className="jd-summary-item"><span className="summary-label">薪资范围</span><span className="summary-value">{job.salary}</span></div>
              <div className="jd-summary-item"><span className="summary-label">工作地点</span><span className="summary-value">{job.location}</span></div>
              <div className="jd-summary-item"><span className="summary-label">职位分类</span><span className="summary-value">{job.category}</span></div>
            </div>
          </div>

          {/* Related Jobs */}
          {relatedJobs.length > 0 && (
            <div className="jd-sidebar-card">
              <h3>相关职位</h3>
              <div className="jd-related-list">
                {relatedJobs.map(rj => (
                  <Link key={rj.id} to={`/job/${rj.id}/${generateJobSlug(rj)}`} className="jd-related-item">
                    <div className="jd-related-title">{rj.title}</div>
                    <div className="jd-related-meta">{rj.company} &bull; {rj.location}</div>
                    <div className="jd-related-salary">{rj.salary}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default JobDetail;
