import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Clock, BookOpen, Calendar, Eye, DollarSign,
  Phone, Mail, User, Bookmark, BookMarked, ChevronRight, Share2, Check, Briefcase
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { useSEO } from '../hooks/useSEO';
import './JobDetail.css';

export function generateResumeSlug(resume) {
  if (!resume) return '';
  const parts = [resume.position, resume.location, resume.experience].filter(Boolean);
  return parts.join('-').replace(/\s+/g, '-').replace(/[/\\?&#%]+/g, '').toLowerCase();
}

const SITE_URL = 'https://welogx.com';

const ResumeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('ew_saved_jobs') || '{}')[`resume_${id}`]; } catch { return false; }
  });

  const fetchResume = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.get(`/resumes/${id}`);
      if (result.success) setResume(result.data);
      else setError('简历不存在');
    } catch (err) {
      setError(err.message || '加载失败');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchResume(); }, [fetchResume]);

  const pageUrl = resume ? `${SITE_URL}/resume/${resume.id}/${generateResumeSlug(resume)}` : '';

  useSEO({
    title: resume ? `${resume.position} 求职 - ${resume.location} | ${resume.experience} - Welogx物流求职` : '简历详情 - Welogx物流招聘',
    description: resume ? `${resume.name}正在${resume.location}求职${resume.position}，拥有${resume.experience}经验。${resume.skills?.slice(0, 5).join('、') || ''}。${(resume.summary || '').slice(0, 120)}` : '物流行业求职信息',
    keywords: resume ? `${resume.position},${resume.location}求职,${resume.experience},物流求职,司机求职` : '物流求职',
    url: pageUrl
  });

  const toggleSave = () => {
    setSaved(prev => {
      const next = !prev;
      try {
        const all = JSON.parse(localStorage.getItem('ew_saved_jobs') || '{}');
        if (next) all[`resume_${id}`] = true; else delete all[`resume_${id}`];
        localStorage.setItem('ew_saved_jobs', JSON.stringify(all));
      } catch {}
      return next;
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${resume.position} - ${resume.name}`, url: pageUrl }); } catch {}
    } else {
      navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="job-detail-page"><div className="job-detail-loading"><div className="loading-spinner" /><p>加载中...</p></div></div>;

  if (error || !resume) {
    return (
      <div className="job-detail-page">
        <div className="job-detail-error">
          <User size={48} />
          <h2>{error || '简历不存在'}</h2>
          <p>该简历可能已被删除或链接无效</p>
          <button onClick={() => navigate('/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统')}>
            返回招聘大厅
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <nav className="jd-breadcrumb" aria-label="breadcrumb">
        <Link to="/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统">招聘求职</Link>
        <ChevronRight size={14} />
        <span>{resume.name} — {resume.position}</span>
      </nav>

      <div className="jd-layout">
        <article className="jd-main">
          <div className="jd-header">
            <div className="jd-company-avatar" style={{ borderRadius: '50%', background: 'linear-gradient(135deg, var(--royal-blue, #4169E1), #1e3a8a)' }}>
              {(resume.name || '?')[0]}
            </div>
            <div className="jd-header-info">
              <h1>{resume.name}</h1>
              <div className="jd-company-name"><Briefcase size={16} /> {resume.position}</div>
            </div>
          </div>

          {resume.expectedSalary && (
            <div className="jd-salary-bar">
              <span className="jd-salary" style={{ background: '#eff6ff', color: '#2563eb' }}><DollarSign size={18} /> 期望薪资: {resume.expectedSalary}</span>
            </div>
          )}

          <div className="jd-tags">
            <span className="jd-tag location"><MapPin size={14} /> {resume.location}</span>
            <span className="jd-tag exp"><BookOpen size={14} /> {resume.experience}</span>
            {resume.workTypePreference && <span className="jd-tag type"><Clock size={14} /> {resume.workTypePreference}</span>}
          </div>

          <div className="jd-meta-bar">
            <span><Eye size={14} /> {resume.views} 次查看</span>
            <span><Calendar size={14} /> 发布于 {resume.posted}</span>
          </div>

          {resume.skills && resume.skills.length > 0 && (
            <section className="jd-section">
              <h2>技能专长</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {resume.skills.map((s, i) => (
                  <span key={i} style={{ background: '#f0f9ff', color: '#0369a1', padding: '5px 14px', borderRadius: 14, fontSize: '0.88rem', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </section>
          )}

          {resume.summary && (
            <section className="jd-section">
              <h2>个人简介</h2>
              <div className="jd-description" style={{ whiteSpace: 'pre-wrap' }}>{resume.summary}</div>
            </section>
          )}

          <section className="jd-section">
            <h2>联系方式</h2>
            <div className="jd-contact-grid">
              <div className="jd-contact-item"><Phone size={18} /><div><div className="contact-label">电话</div><a href={`tel:${resume.phone}`} className="contact-value">{resume.phone}</a></div></div>
              <div className="jd-contact-item"><Mail size={18} /><div><div className="contact-label">邮箱</div><a href={`mailto:${resume.email}`} className="contact-value">{resume.email}</a></div></div>
            </div>
          </section>

          <div className="jd-action-bar">
            <button className="jd-btn primary" onClick={() => window.location.href = `tel:${resume.phone}`}>
              <Phone size={16} /> 联系求职者
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

        <aside className="jd-sidebar">
          <div className="jd-sidebar-card">
            <h3>求职概要</h3>
            <div className="jd-summary-list">
              <div className="jd-summary-item"><span className="summary-label">求职岗位</span><span className="summary-value">{resume.position}</span></div>
              <div className="jd-summary-item"><span className="summary-label">工作经验</span><span className="summary-value">{resume.experience}</span></div>
              <div className="jd-summary-item"><span className="summary-label">期望地点</span><span className="summary-value">{resume.location}</span></div>
              {resume.expectedSalary && <div className="jd-summary-item"><span className="summary-label">期望薪资</span><span className="summary-value">{resume.expectedSalary}</span></div>}
              {resume.workTypePreference && <div className="jd-summary-item"><span className="summary-label">工作类型</span><span className="summary-value">{resume.workTypePreference}</span></div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ResumeDetail;
