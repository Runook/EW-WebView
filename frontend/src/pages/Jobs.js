import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Briefcase, User, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Star, MapPin, Clock, BookOpen, Calendar, Send, Bookmark, BookMarked,
  Phone, Mail, X, Eye, Edit, Trash2, DollarSign, Users, TrendingUp, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PremiumPostModal from '../components/PremiumPostModal';
import { useNotification } from '../components/common/Notification';
import { apiLogger } from '../utils/logger';
import { generateJobSlug } from './JobDetail';
import { generateResumeSlug } from './ResumeDetail';
import { useModal, useLoading } from '../hooks';
import { apiClient } from '../utils/apiClient';
import './Jobs.css';

const ITEMS_PER_PAGE = 12;

const JOB_CATEGORIES = [
  'CLASS A 司机', 'CLASS B 司机', 'CLASS D 司机', '调度找召卡车',
  '文员OP', '跟单/客服', '应收应付会计', '卸柜搬货工',
  '出单出货 点数', '物流销售', '货运代理', '卡车修理技工', '货运经纪', '报关师'
];

const LOCATIONS = [
  'Alabama (AL)', 'Alaska (AK)', 'Arizona (AZ)', 'Arkansas (AR)', 'California (CA)',
  'Colorado (CO)', 'Connecticut (CT)', 'Delaware (DE)', 'Florida (FL)', 'Georgia (GA)',
  'Hawaii (HI)', 'Idaho (ID)', 'Illinois (IL)', 'Indiana (IN)', 'Iowa (IA)',
  'Kansas (KS)', 'Kentucky (KY)', 'Louisiana (LA)', 'Maine (ME)', 'Maryland (MD)',
  'Massachusetts (MA)', 'Michigan (MI)', 'Minnesota (MN)', 'Mississippi (MS)', 'Missouri (MO)',
  'Montana (MT)', 'Nebraska (NE)', 'Nevada (NV)', 'New Hampshire (NH)', 'New Jersey (NJ)',
  'New Mexico (NM)', 'New York (NY)', 'North Carolina (NC)', 'North Dakota (ND)', 'Ohio (OH)',
  'Oklahoma (OK)', 'Oregon (OR)', 'Pennsylvania (PA)', 'Rhode Island (RI)', 'South Carolina (SC)',
  'South Dakota (SD)', 'Tennessee (TN)', 'Texas (TX)', 'Utah (UT)', 'Vermont (VT)',
  'Virginia (VA)', 'Washington (WA)', 'West Virginia (WV)', 'Wisconsin (WI)', 'Wyoming (WY)',
  'Washington D.C.'
];

const WORK_TYPES = ['全职', '兼职', '合同工', '临时工'];
const EXPERIENCE_OPTIONS = ['经验不限', '1年以内', '1-3年', '3-5年', '5-10年', '10年以上'];

const Jobs = () => {
  const { success, error: showError, apiError } = useNotification();
  const postModal = useModal();
  const premiumModal = useModal();
  const { withLoading } = useLoading(false);
  const { isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [currentFormData, setCurrentFormData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ew_saved_jobs') || '{}'); } catch { return {}; }
  });

  const [filters, setFilters] = useState({ category: '', location: '', workType: '', experience: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const fetchCategoryStats = useCallback(async () => {
    try {
      const result = await apiClient.get('/jobs/stats/categories');
      if (result.success) setCategoryStats(result.data);
    } catch (err) { apiLogger.error('Stats error', err); }
  }, []);

  const fetchJobs = useCallback(async (page = 1) => {
    await withLoading(async () => {
      try {
        const params = { page, limit: ITEMS_PER_PAGE };
        if (searchQuery) params.search = searchQuery;
        if (filters.category) params.category = filters.category;
        if (filters.location) params.location = filters.location;
        if (filters.workType) params.workType = filters.workType;
        if (filters.experience) params.experience = filters.experience;

        const result = await apiClient.get('/jobs', params);
        if (result.success) {
          setJobs(result.data);
          setPagination({ page: result.page, total: result.total, totalPages: result.totalPages });
        }
      } catch (error) {
        apiLogger.error('获取职位数据错误', error);
        apiError('获取职位数据', error);
      }
    });
  }, [withLoading, apiError, searchQuery, filters]);

  const fetchResumes = useCallback(async (page = 1) => {
    await withLoading(async () => {
      try {
        const params = { page, limit: ITEMS_PER_PAGE };
        if (searchQuery) params.search = searchQuery;
        if (filters.location) params.location = filters.location;
        if (filters.experience) params.experience = filters.experience;

        const result = await apiClient.get('/resumes', params);
        if (result.success) {
          setResumes(result.data);
          setPagination({ page: result.page, total: result.total, totalPages: result.totalPages });
        }
      } catch (error) {
        apiLogger.error('获取简历数据错误', error);
        apiError('获取简历数据', error);
      }
    });
  }, [withLoading, apiError, searchQuery, filters]);

  useEffect(() => { fetchCategoryStats(); }, [fetchCategoryStats]);

  useEffect(() => {
    setPagination(p => ({ ...p, page: 1 }));
    if (activeTab === 'jobs') fetchJobs(1);
    else fetchResumes(1);
  }, [activeTab, searchQuery, filters, fetchJobs, fetchResumes]);

  const totalStats = useMemo(() => {
    const totalJobs = Object.values(categoryStats).reduce((a, b) => a + b, 0);
    return { totalJobs, totalResumes: pagination.total };
  }, [categoryStats, pagination.total]);

  const toggleSaved = (type, id) => {
    const key = `${type}_${id}`;
    setSavedIds(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      localStorage.setItem('ew_saved_jobs', JSON.stringify(next));
      return next;
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    if (activeTab === 'jobs') fetchJobs(newPage);
    else fetchResumes(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePost = (formData) => {
    if (!isAuthenticated) { showError('请先登录再发布'); return; }
    const formDataObj = {};
    for (let [key, value] of formData.entries()) formDataObj[key] = value;
    setCurrentFormData(formDataObj);
    postModal.close();
    premiumModal.open();
  };

  const handleConfirmPost = async ({ formData, premium }) => {
    await withLoading(async () => {
      try {
        const postData = { ...formData, premium };
        const endpoint = activeTab === 'jobs' ? '/jobs' : '/resumes';
        const result = await apiClient.post(endpoint, postData);
        if (result.success) {
          premiumModal.close();
          setCurrentFormData(null);
          if (activeTab === 'jobs') { fetchJobs(1); fetchCategoryStats(); } else fetchResumes(1);
          success(`${activeTab === 'jobs' ? '职位' : '简历'}发布成功！已扣除 ${result.creditsSpent} 积分`);
        } else throw new Error(result.message || '发布失败');
      } catch (error) {
        apiLogger.error('发布失败', error);
        showError('发布失败: ' + error.message);
      }
    });
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`确定要删除这条${type === 'job' ? '职位' : '简历'}吗？`)) return;
    try {
      const endpoint = type === 'job' ? `/jobs/${id}` : `/resumes/${id}`;
      const result = await apiClient.delete(endpoint);
      if (result.success) {
        success('删除成功');
        if (activeTab === 'jobs') { fetchJobs(pagination.page); fetchCategoryStats(); } else fetchResumes(pagination.page);
      }
    } catch (error) { showError('删除失败: ' + error.message); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {};
    for (let [key, value] of fd.entries()) data[key] = value;
    try {
      const type = editItem._editType;
      const endpoint = type === 'job' ? `/jobs/${editItem.id}` : `/resumes/${editItem.id}`;
      if (type === 'resume' && data.skills) {
        data.skills = data.skills.split(/[,，]/).map(s => s.trim()).filter(Boolean);
      }
      const result = await apiClient.put(endpoint, data);
      if (result.success) {
        success('更新成功');
        setEditItem(null);
        if (activeTab === 'jobs') fetchJobs(pagination.page);
        else fetchResumes(pagination.page);
      }
    } catch (error) { showError('更新失败: ' + error.message); }
  };

  const currentUserId = user?.userId || user?.id;

  const clearFilters = () => {
    setFilters({ category: '', location: '', workType: '', experience: '' });
    setSearchQuery('');
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="jobs-page">
      {/* Hero */}
      <div className="jobs-hero">
        <div className="jobs-hero-content">
          <h1>物流招聘求职</h1>
          <p>连接北美物流企业与专业人才 — 司机、调度、报关、仓储</p>
          <div className="jobs-hero-stats">
            <div className="hero-stat"><Briefcase size={20} /><span className="hero-stat-num">{totalStats.totalJobs}</span><span>招聘职位</span></div>
            <div className="hero-stat"><Users size={20} /><span className="hero-stat-num">{resumes.length || 0}</span><span>求职简历</span></div>
            <div className="hero-stat"><TrendingUp size={20} /><span className="hero-stat-num">{Object.keys(categoryStats).length}</span><span>热门分类</span></div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="jobs-tab-bar">
        <button className={`jobs-tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
          <Briefcase size={18} /> 招聘职位
        </button>
        <button className={`jobs-tab ${activeTab === 'resumes' ? 'active' : ''}`} onClick={() => setActiveTab('resumes')}>
          <User size={18} /> 求职简历
        </button>
      </div>

      {/* Category Pills (jobs only) */}
      {activeTab === 'jobs' && Object.keys(categoryStats).length > 0 && (
        <div className="jobs-category-bar">
          <button className={`cat-pill ${!filters.category ? 'active' : ''}`} onClick={() => setFilters(f => ({ ...f, category: '' }))}>
            全部
          </button>
          {Object.entries(categoryStats).map(([cat, count]) => (
            <button key={cat} className={`cat-pill ${filters.category === cat ? 'active' : ''}`} onClick={() => setFilters(f => ({ ...f, category: f.category === cat ? '' : cat }))}>
              {cat} <span className="cat-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search & Controls */}
      <div className="jobs-controls">
        <div className="jobs-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={activeTab === 'jobs' ? '搜索职位、公司...' : '搜索求职者、职位...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}><X size={16} /></button>}
        </div>
        <div className="jobs-control-btns">
          <button className={`jobs-filter-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} /> 筛选 {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
            <ChevronDown size={14} className={showFilters ? 'rotated' : ''} />
          </button>
          <button className="jobs-post-btn" onClick={postModal.open}>
            <Plus size={18} /> {activeTab === 'jobs' ? '发布职位' : '发布简历'}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="jobs-filter-panel">
          <div className="filter-grid">
            {activeTab === 'jobs' && (
              <div className="filter-item">
                <label>职位分类</label>
                <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
                  <option value="">全部分类</option>
                  {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div className="filter-item">
              <label>工作州</label>
              <select value={filters.location} onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}>
                <option value="">全部州</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="filter-item">
              <label>工作类型</label>
              <select value={filters.workType} onChange={(e) => setFilters(f => ({ ...f, workType: e.target.value }))}>
                <option value="">全部类型</option>
                {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="filter-item">
              <label>工作经验</label>
              <select value={filters.experience} onChange={(e) => setFilters(f => ({ ...f, experience: e.target.value }))}>
                <option value="">全部经验</option>
                {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="filter-actions-bar">
              <span className="filter-count-label">{activeFilterCount} 个筛选条件</span>
              <button className="clear-filters-btn" onClick={clearFilters}>清除全部</button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="jobs-content-area">
        {activeTab === 'jobs' ? (
          <div className="jobs-grid">
            {jobs.length > 0 ? jobs.map(job => (
              <div key={job.id} className={`jcard${job.is_premium ? ' jcard-premium' : ''}${job.premium_type === 'top' ? ' jcard-top' : ''}${job.premium_type === 'highlight' ? ' jcard-highlight' : ''}`}>
                {job.premium_type === 'top' && <div className="jcard-top-badge"><Star size={12} fill="currentColor" /> 置顶</div>}
                <Link to={`/job/${job.id}/${generateJobSlug(job)}`} className="jcard-header">
                  <div className="jcard-company-avatar">{(job.company || '?')[0]}</div>
                  <div className="jcard-header-info">
                    <h3 className="jcard-title">{job.title}</h3>
                    <div className="jcard-company"><Building2 size={14} /> {job.company}</div>
                  </div>
                  <div className="jcard-salary"><DollarSign size={14} /> {job.salary}</div>
                </Link>
                <div className="jcard-tags">
                  <span className="jtag location"><MapPin size={12} /> {job.location}</span>
                  <span className="jtag type"><Clock size={12} /> {job.type}</span>
                  <span className="jtag exp"><BookOpen size={12} /> {job.experience}</span>
                  {job.category && <span className="jtag cat">{job.category}</span>}
                </div>
                <p className="jcard-desc">{job.description}</p>
                <div className="jcard-footer">
                  <div className="jcard-meta">
                    <span><Eye size={13} /> {job.views}</span>
                    <span><Calendar size={13} /> {job.posted}</span>
                  </div>
                  <div className="jcard-actions">
                    {currentUserId && job.publisher?.userId === currentUserId && (
                      <>
                        <button className="jact edit" title="编辑" onClick={(e) => { e.stopPropagation(); setEditItem({ ...job, _editType: 'job' }); }}>
                          <Edit size={14} />
                        </button>
                        <button className="jact delete" title="删除" onClick={(e) => { e.stopPropagation(); handleDelete('job', job.id); }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    <button className={`jact save ${savedIds[`job_${job.id}`] ? 'saved' : ''}`} title="收藏" onClick={(e) => { e.stopPropagation(); toggleSaved('job', job.id); }}>
                      {savedIds[`job_${job.id}`] ? <BookMarked size={14} /> : <Bookmark size={14} />}
                    </button>
                    <Link to={`/job/${job.id}/${generateJobSlug(job)}`} className="jact apply" onClick={(e) => e.stopPropagation()}>
                      <Send size={14} /> 申请
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
              <div className="jobs-empty"><Briefcase size={56} /><h3>暂无职位信息</h3><p>试试调整搜索条件或发布您的招聘需求</p></div>
            )}
          </div>
        ) : (
          <div className="jobs-grid">
            {resumes.length > 0 ? resumes.map(resume => (
              <div key={resume.id} className={`rcard${resume.is_premium ? ' rcard-premium' : ''}${resume.premium_type === 'top' ? ' jcard-top' : ''}${resume.premium_type === 'highlight' ? ' jcard-highlight' : ''}`}>
                {resume.premium_type === 'top' && <div className="jcard-top-badge"><Star size={12} fill="currentColor" /> 置顶</div>}
                <Link to={`/resume/${resume.id}/${generateResumeSlug(resume)}`} className="rcard-header">
                  <div className="rcard-avatar">{(resume.name || '?')[0]}</div>
                  <div className="rcard-header-info">
                    <h3 className="rcard-name">{resume.name}</h3>
                    <div className="rcard-position">{resume.position}</div>
                  </div>
                  {resume.expectedSalary && <div className="rcard-salary">{resume.expectedSalary}</div>}
                </Link>
                <div className="jcard-tags">
                  <span className="jtag location"><MapPin size={12} /> {resume.location}</span>
                  <span className="jtag exp"><BookOpen size={12} /> {resume.experience}</span>
                  {resume.workTypePreference && <span className="jtag type"><Clock size={12} /> {resume.workTypePreference}</span>}
                </div>
                {resume.skills && resume.skills.length > 0 && (
                  <div className="rcard-skills">
                    {resume.skills.slice(0, 6).map((skill, idx) => <span key={idx} className="skill-pill">{skill}</span>)}
                    {resume.skills.length > 6 && <span className="skill-pill more">+{resume.skills.length - 6}</span>}
                  </div>
                )}
                {resume.summary && <p className="jcard-desc">{resume.summary}</p>}
                <div className="jcard-footer">
                  <div className="jcard-meta">
                    <span><Eye size={13} /> {resume.views}</span>
                    <span><Calendar size={13} /> {resume.posted}</span>
                  </div>
                  <div className="jcard-actions">
                    {currentUserId && resume.publisher?.userId === currentUserId && (
                      <>
                        <button className="jact edit" title="编辑" onClick={(e) => { e.stopPropagation(); setEditItem({ ...resume, _editType: 'resume' }); }}>
                          <Edit size={14} />
                        </button>
                        <button className="jact delete" title="删除" onClick={(e) => { e.stopPropagation(); handleDelete('resume', resume.id); }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    <button className={`jact save ${savedIds[`resume_${resume.id}`] ? 'saved' : ''}`} title="收藏" onClick={(e) => { e.stopPropagation(); toggleSaved('resume', resume.id); }}>
                      {savedIds[`resume_${resume.id}`] ? <BookMarked size={14} /> : <Bookmark size={14} />}
                    </button>
                    <Link to={`/resume/${resume.id}/${generateResumeSlug(resume)}`} className="jact apply" onClick={(e) => e.stopPropagation()}>
                      <Phone size={14} /> 联系
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
              <div className="jobs-empty"><User size={56} /><h3>暂无简历信息</h3><p>试试调整搜索条件或发布您的简历信息</p></div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="jobs-pagination">
            <button disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 7) pageNum = i + 1;
              else if (pagination.page <= 4) pageNum = i + 1;
              else if (pagination.page >= pagination.totalPages - 3) pageNum = pagination.totalPages - 6 + i;
              else pageNum = pagination.page - 3 + i;
              return (
                <button key={pageNum} className={pagination.page === pageNum ? 'active' : ''} onClick={() => handlePageChange(pageNum)}>
                  {pageNum}
                </button>
              );
            })}
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)}><ChevronRight size={16} /></button>
            <span className="page-info">共 {pagination.total} 条</span>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div className="jobs-modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="jobs-modal" onClick={e => e.stopPropagation()}>
            <button className="jobs-modal-close" onClick={() => setDetailItem(null)}><X size={22} /></button>
            {detailItem._type === 'job' ? (
              <div className="detail-job">
                <div className="detail-header">
                  <div className="detail-avatar">{(detailItem.company || '?')[0]}</div>
                  <div>
                    <h2>{detailItem.title}</h2>
                    <div className="detail-company">{detailItem.company}</div>
                  </div>
                  <div className="detail-salary"><DollarSign size={16} /> {detailItem.salary}</div>
                </div>
                <div className="detail-tags">
                  <span className="jtag location"><MapPin size={13} /> {detailItem.location}</span>
                  <span className="jtag type"><Clock size={13} /> {detailItem.type}</span>
                  <span className="jtag exp"><BookOpen size={13} /> {detailItem.experience}</span>
                  {detailItem.category && <span className="jtag cat">{detailItem.category}</span>}
                </div>
                <div className="detail-section">
                  <h4>职位描述</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{detailItem.description}</p>
                </div>
                <div className="detail-section">
                  <h4>联系方式</h4>
                  <div className="detail-contact">
                    {detailItem.contactPerson && <div className="contact-row"><User size={16} /> {detailItem.contactPerson}</div>}
                    {detailItem.contactPhone && <div className="contact-row"><Phone size={16} /> <a href={`tel:${detailItem.contactPhone}`}>{detailItem.contactPhone}</a></div>}
                    {detailItem.contactEmail && <div className="contact-row"><Mail size={16} /> <a href={`mailto:${detailItem.contactEmail}`}>{detailItem.contactEmail}</a></div>}
                  </div>
                </div>
                <div className="detail-meta"><Eye size={14} /> {detailItem.views} 次查看 &nbsp;&bull;&nbsp; <Calendar size={14} /> {detailItem.posted}</div>
              </div>
            ) : (
              <div className="detail-resume">
                <div className="detail-header">
                  <div className="detail-avatar resume-av">{(detailItem.name || '?')[0]}</div>
                  <div>
                    <h2>{detailItem.name}</h2>
                    <div className="detail-company">{detailItem.position}</div>
                  </div>
                  {detailItem.expectedSalary && <div className="detail-salary">{detailItem.expectedSalary}</div>}
                </div>
                <div className="detail-tags">
                  <span className="jtag location"><MapPin size={13} /> {detailItem.location}</span>
                  <span className="jtag exp"><BookOpen size={13} /> {detailItem.experience}</span>
                  {detailItem.workTypePreference && <span className="jtag type"><Clock size={13} /> {detailItem.workTypePreference}</span>}
                </div>
                {detailItem.skills && detailItem.skills.length > 0 && (
                  <div className="detail-section">
                    <h4>技能专长</h4>
                    <div className="rcard-skills">{detailItem.skills.map((s, i) => <span key={i} className="skill-pill">{s}</span>)}</div>
                  </div>
                )}
                {detailItem.summary && (
                  <div className="detail-section">
                    <h4>个人简介</h4>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{detailItem.summary}</p>
                  </div>
                )}
                <div className="detail-section">
                  <h4>联系方式</h4>
                  <div className="detail-contact">
                    <div className="contact-row"><Phone size={16} /> <a href={`tel:${detailItem.phone}`}>{detailItem.phone}</a></div>
                    <div className="contact-row"><Mail size={16} /> <a href={`mailto:${detailItem.email}`}>{detailItem.email}</a></div>
                  </div>
                </div>
                <div className="detail-meta"><Eye size={14} /> {detailItem.views} 次查看 &nbsp;&bull;&nbsp; <Calendar size={14} /> {detailItem.posted}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="jobs-modal-overlay" onClick={() => setEditItem(null)}>
          <div className="jobs-modal" onClick={e => e.stopPropagation()}>
            <button className="jobs-modal-close" onClick={() => setEditItem(null)}><X size={22} /></button>
            <h2 className="edit-modal-title">{editItem._editType === 'job' ? '编辑职位' : '编辑简历'}</h2>
            <form className="edit-form" onSubmit={handleEditSubmit}>
              {editItem._editType === 'job' ? (
                <>
                  <div className="form-group"><label>职位名称</label><input name="title" defaultValue={editItem.title} required /></div>
                  <div className="form-group"><label>职位分类</label>
                    <select name="category" defaultValue={editItem.category} required>
                      {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>公司名称</label><input name="company" defaultValue={editItem.company} required /></div>
                  <div className="form-row">
                    <div className="form-group"><label>工作州</label>
                      <select name="location" defaultValue={editItem.location} required>
                        <option value="">请选择州</option>
                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>薪资待遇</label><input name="salary" defaultValue={editItem.salary} required /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>工作类型</label>
                      <select name="workType" defaultValue={editItem.type} required>
                        {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>经验要求</label>
                      <select name="experience" defaultValue={editItem.experience} required>
                        {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label>职位描述</label><textarea name="description" defaultValue={editItem.description} rows={5} required /></div>
                  <div className="form-row">
                    <div className="form-group"><label>联系人</label><input name="contactPerson" defaultValue={editItem.contactPerson} /></div>
                    <div className="form-group"><label>联系电话</label><input name="contactPhone" defaultValue={editItem.contactPhone} /></div>
                  </div>
                  <div className="form-group"><label>联系邮箱</label><input name="contactEmail" defaultValue={editItem.contactEmail} type="email" /></div>
                </>
              ) : (
                <>
                  <div className="form-group"><label>姓名</label><input name="name" defaultValue={editItem.name} required /></div>
                  <div className="form-group"><label>求职岗位</label><input name="position" defaultValue={editItem.position} required /></div>
                  <div className="form-row">
                    <div className="form-group"><label>工作经验</label>
                      <select name="experience" defaultValue={editItem.experience} required>
                        {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>期望州</label>
                      <select name="location" defaultValue={editItem.location} required>
                        <option value="">请选择州</option>
                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>联系电话</label><input name="phone" defaultValue={editItem.phone} required /></div>
                    <div className="form-group"><label>邮箱</label><input name="email" defaultValue={editItem.email} type="email" required /></div>
                  </div>
                  <div className="form-group"><label>技能专长</label><input name="skills" defaultValue={editItem.skills?.join(', ')} /></div>
                  <div className="form-row">
                    <div className="form-group"><label>期望薪资</label><input name="expectedSalary" defaultValue={editItem.expectedSalary} /></div>
                    <div className="form-group"><label>工作类型偏好</label>
                      <select name="workTypePreference" defaultValue={editItem.workTypePreference}>
                        <option value="">不限</option>
                        {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label>个人简介</label><textarea name="summary" defaultValue={editItem.summary} rows={4} /></div>
                </>
              )}
              <div className="edit-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditItem(null)}>取消</button>
                <button type="submit" className="btn-save"><Send size={16} /> 保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {postModal.isOpen && (
        <div className="jobs-modal-overlay" onClick={postModal.close}>
          <div className="jobs-modal" onClick={e => e.stopPropagation()}>
            <button className="jobs-modal-close" onClick={postModal.close}><X size={22} /></button>
            <h2 className="edit-modal-title">{activeTab === 'jobs' ? '发布招聘职位' : '发布求职简历'}</h2>
            <form className="edit-form" onSubmit={(e) => { e.preventDefault(); handlePost(new FormData(e.target)); }}>
              {activeTab === 'jobs' ? (
                <>
                  <div className="form-group"><label>职位名称 *</label><input name="title" required placeholder="如：CLASS A 司机" /></div>
                  <div className="form-group"><label>职位分类 *</label>
                    <select name="category" required><option value="">请选择</option>{JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div className="form-group"><label>公司名称 *</label><input name="company" required placeholder="公司名称" /></div>
                  <div className="form-row">
                    <div className="form-group"><label>工作州 *</label>
                      <select name="location" required><option value="">请选择州</option>{LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}</select>
                    </div>
                    <div className="form-group"><label>薪资待遇 *</label><input name="salary" required placeholder="如：$4000-6000/月" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>工作类型 *</label>
                      <select name="workType" required><option value="">请选择</option>{WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}</select>
                    </div>
                    <div className="form-group"><label>经验要求 *</label>
                      <select name="experience" required><option value="">请选择</option>{EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    </div>
                  </div>
                  <div className="form-group"><label>职位描述 *</label><textarea name="description" required rows={5} placeholder="详细描述职位要求、工作内容、福利待遇等..." /></div>
                  <div className="form-row">
                    <div className="form-group"><label>联系人</label><input name="contactPerson" placeholder="如：张经理" /></div>
                    <div className="form-group"><label>联系电话 *</label><input name="contactPhone" required placeholder="如：(323) 888-1001" /></div>
                  </div>
                  <div className="form-group"><label>联系邮箱 *</label><input name="contactEmail" required type="email" placeholder="如：hr@company.com" /></div>
                </>
              ) : (
                <>
                  <div className="form-group"><label>姓名 *</label><input name="name" required placeholder="如：张三" /></div>
                  <div className="form-group"><label>求职岗位 *</label><input name="position" required placeholder="如：CLASS A 司机" /></div>
                  <div className="form-row">
                    <div className="form-group"><label>工作经验 *</label>
                      <select name="experience" required><option value="">请选择</option>{EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    </div>
                    <div className="form-group"><label>期望州 *</label>
                      <select name="location" required><option value="">请选择州</option>{LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}</select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>联系电话 *</label><input name="phone" required placeholder="(123) 456-7890" /></div>
                    <div className="form-group"><label>邮箱 *</label><input name="email" required type="email" placeholder="zhangsan@email.com" /></div>
                  </div>
                  <div className="form-group"><label>技能专长 *</label><input name="skills" required placeholder="用逗号分隔，如：CDL-A驾照, 长途运输" /></div>
                  <div className="form-row">
                    <div className="form-group"><label>期望薪资</label><input name="expectedSalary" placeholder="如：$4000-5000/月" /></div>
                    <div className="form-group"><label>工作类型偏好</label>
                      <select name="workTypePreference"><option value="">不限</option>{WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}</select>
                    </div>
                  </div>
                  <div className="form-group"><label>个人简介</label><textarea name="summary" rows={4} placeholder="简要介绍您的工作经验、技能优势等..." /></div>
                </>
              )}
              <div className="edit-form-actions">
                <button type="button" className="btn-cancel" onClick={postModal.close}>取消</button>
                <button type="submit" className="btn-save"><Send size={16} /> 发布</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Modal */}
      <PremiumPostModal
        isOpen={premiumModal.isOpen}
        onClose={() => { premiumModal.close(); setCurrentFormData(null); }}
        onConfirm={handleConfirmPost}
        postType={activeTab === 'jobs' ? 'job' : 'resume'}
        formData={currentFormData}
      />
    </div>
  );
};

export default Jobs;
