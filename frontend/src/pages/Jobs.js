import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus, Briefcase, User, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Star, MapPin, Clock, BookOpen, Calendar, Send, Bookmark, BookMarked,
  Phone, Mail, X, Eye, Edit, Trash2, DollarSign, Users, TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/common/Notification';
import { apiLogger } from '../utils/logger';
import { generateJobSlug } from './JobDetail';
import { generateResumeSlug } from './ResumeDetail';
import { useLoading } from '../hooks';
import { apiClient } from '../utils/apiClient';
import { PATH_JOBS } from '../constants/servicePaths';
import { JOB_CATEGORIES, LOCATIONS, WORK_TYPES, EXPERIENCE_OPTIONS } from './jobsConstants';
import './Jobs.css';

const ITEMS_PER_PAGE = 12;

const formatLocationShort = (location) => {
  if (!location) return '—';
  const parts = location.split(', ').map(s => {
    const m = s.match(/\(([A-Z]{2})\)/);
    return m ? m[1] : s;
  });
  if (parts.length <= 3) return parts.join(', ');
  return `${parts.slice(0, 2).join(', ')} +${parts.length - 2}`;
};

const EditStateMultiSelect = ({ selected, onChange, label = '工作州' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(
    () => search ? LOCATIONS.filter(l => l.toLowerCase().includes(search.toLowerCase())) : LOCATIONS,
    [search]
  );

  const toggle = (loc) => {
    onChange(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  };

  return (
    <div className="form-group state-multi-group" ref={ref}>
      <label>{label}</label>
      <div className={`state-multi-trigger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        {selected.length === 0
          ? <span className="state-multi-placeholder">请选择州（选填）</span>
          : <span className="state-multi-count">{selected.length} 个州已选</span>
        }
        <ChevronDown size={16} className={open ? 'rotated' : ''} />
      </div>
      {selected.length > 0 && (
        <div className="state-multi-tags">
          {selected.map(s => (
            <span key={s} className="state-tag">
              {s.match(/\(([A-Z]{2})\)/)?.[1] || s}
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(prev => prev.filter(l => l !== s)); }}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="state-multi-dropdown">
          <div className="state-multi-search">
            <Search size={14} />
            <input type="text" placeholder="搜索州..." value={search} onChange={(e) => setSearch(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus />
          </div>
          <div className="state-multi-list">
            {filtered.map(loc => (
              <label key={loc} className={`state-multi-option ${selected.includes(loc) ? 'checked' : ''}`}>
                <input type="checkbox" checked={selected.includes(loc)} onChange={() => toggle(loc)} />
                <span>{loc}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="state-multi-footer">
              <button type="button" className="state-clear-btn" onClick={() => onChange([])}>清除全部</button>
              <button type="button" className="state-done-btn" onClick={() => setOpen(false)}>确定 ({selected.length})</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Jobs = () => {
  const { success, error: showError, apiError } = useNotification();
  const { withLoading } = useLoading(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const view = searchParams.get('view') === 'resumes' ? 'resumes' : 'jobs';
  const activeTab = view === 'jobs' ? 'jobs' : 'resumes';

  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [resumeTotalCount, setResumeTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editStates, setEditStates] = useState([]);
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
          setResumeTotalCount(result.total ?? 0);
        }
      } catch (error) {
        apiLogger.error('获取简历数据错误', error);
        apiError('获取简历数据', error);
      }
    });
  }, [withLoading, apiError, searchQuery, filters]);

  useEffect(() => { fetchCategoryStats(); }, [fetchCategoryStats]);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiClient.get('/resumes', { page: 1, limit: 1 });
        if (r.success && typeof r.total === 'number') setResumeTotalCount(r.total);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    setPagination(p => ({ ...p, page: 1 }));
    if (activeTab === 'jobs') fetchJobs(1);
    else fetchResumes(1);
  }, [activeTab, searchQuery, filters, fetchJobs, fetchResumes]);

  const totalStats = useMemo(() => ({
    totalJobs: Object.values(categoryStats).reduce((a, b) => a + b, 0)
  }), [categoryStats]);

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
    data.location = editStates.join(', ');
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

  const listBase = PATH_JOBS;
  const jobsListLink = `${listBase}?view=jobs`;
  const resumesListLink = `${listBase}?view=resumes`;

  return (
    <div className="jobs-page">
      <div className="jobs-hero">
        <div className="jobs-hero-content">
          <h1>物流招聘求职</h1>
          <p>连接北美物流企业与专业人才 — 司机、调度、报关、仓储</p>
          <div className="jobs-hero-stats">
            <div className="hero-stat"><Briefcase size={20} /><span className="hero-stat-num">{totalStats.totalJobs}</span><span>招聘职位</span></div>
            <div className="hero-stat"><Users size={20} /><span className="hero-stat-num">{resumeTotalCount}</span><span>求职简历</span></div>
            <div className="hero-stat"><TrendingUp size={20} /><span className="hero-stat-num">{Object.keys(categoryStats).length}</span><span>热门分类</span></div>
          </div>
        </div>
      </div>

      <div className="jobs-view-switch">
        <Link className={`jobs-view-link ${view === 'jobs' ? 'active' : ''}`} to={jobsListLink}>招聘职位</Link>
        <span className="jobs-view-sep" aria-hidden>·</span>
        <Link className={`jobs-view-link ${view === 'resumes' ? 'active' : ''}`} to={resumesListLink}>求职简历</Link>
      </div>

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
          <Link className="jobs-post-btn" to={activeTab === 'jobs' ? `${listBase}/post?kind=job` : `${listBase}/post?kind=resume`}>
            <Plus size={18} /> {activeTab === 'jobs' ? '发布职位' : '发布简历'}
          </Link>
        </div>
      </div>

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

      <div className="jobs-content-area">
        {activeTab === 'jobs' ? (
          <div className="jobs-table-wrap">
            {jobs.length > 0 ? (
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>职位</th>
                    <th>公司</th>
                    <th>州</th>
                    <th>薪资</th>
                    <th>类型</th>
                    <th>日期</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id} className={job.premium_type === 'top' ? 'row-top' : ''}>
                      <td>
                        <div className="jobs-td-title">
                          {job.premium_type === 'top' && <span className="jobs-pin-badge"><Star size={12} />置顶</span>}
                          <Link to={`/job/${job.id}/${generateJobSlug(job)}`}>{job.title}</Link>
                        </div>
                        {job.category && <span className="jobs-td-sub muted">{job.category}</span>}
                      </td>
                      <td>{job.company}</td>
                      <td><span className="jobs-td-location"><MapPin size={12} /> {formatLocationShort(job.location)}</span></td>
                      <td>{job.salary && !String(job.salary).startsWith('$') ? '$' + job.salary : job.salary}</td>
                      <td>{job.type}</td>
                      <td className="muted">{job.posted}</td>
                      <td>
                        <div className="jobs-td-actions">
                          {currentUserId && job.publisher?.userId === currentUserId && (
                            <>
                              <button type="button" className="jact edit" title="编辑" onClick={() => { setEditItem({ ...job, _editType: 'job' }); setEditStates(job.location ? job.location.split(', ').filter(Boolean) : []); }}><Edit size={14} /></button>
                              <button type="button" className="jact delete" title="删除" onClick={() => handleDelete('job', job.id)}><Trash2 size={14} /></button>
                            </>
                          )}
                          <button type="button" className={`jact save ${savedIds[`job_${job.id}`] ? 'saved' : ''}`} title="收藏" onClick={() => toggleSaved('job', job.id)}>
                            {savedIds[`job_${job.id}`] ? <BookMarked size={14} /> : <Bookmark size={14} />}
                          </button>
                          <Link to={`/job/${job.id}/${generateJobSlug(job)}`} className="jact apply"><Send size={14} /> 申请</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="jobs-empty"><Briefcase size={56} /><h3>暂无职位信息</h3><p>试试调整搜索条件或发布您的招聘需求</p></div>
            )}
          </div>
        ) : (
          <div className="jobs-table-wrap">
            {resumes.length > 0 ? (
              <table className="jobs-table jobs-table-resumes">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>求职岗位</th>
                    <th>州</th>
                    <th>经验</th>
                    <th>日期</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {resumes.map(resume => (
                    <tr key={resume.id} className={resume.premium_type === 'top' ? 'row-top' : ''}>
                      <td>
                        <div className="jobs-td-title">
                          {resume.premium_type === 'top' && <span className="jobs-pin-badge"><Star size={12} />置顶</span>}
                          <Link to={`/resume/${resume.id}/${generateResumeSlug(resume)}`}>{resume.name}</Link>
                        </div>
                      </td>
                      <td>{resume.position}</td>
                      <td><span className="jobs-td-location"><MapPin size={12} /> {formatLocationShort(resume.location)}</span></td>
                      <td>{resume.experience}</td>
                      <td className="muted">{resume.posted}</td>
                      <td>
                        <div className="jobs-td-actions">
                          {currentUserId && resume.publisher?.userId === currentUserId && (
                            <>
                              <button type="button" className="jact edit" title="编辑" onClick={() => { setEditItem({ ...resume, _editType: 'resume' }); setEditStates(resume.location ? resume.location.split(', ').filter(Boolean) : []); }}><Edit size={14} /></button>
                              <button type="button" className="jact delete" title="删除" onClick={() => handleDelete('resume', resume.id)}><Trash2 size={14} /></button>
                            </>
                          )}
                          <button type="button" className={`jact save ${savedIds[`resume_${resume.id}`] ? 'saved' : ''}`} title="收藏" onClick={() => toggleSaved('resume', resume.id)}>
                            {savedIds[`resume_${resume.id}`] ? <BookMarked size={14} /> : <Bookmark size={14} />}
                          </button>
                          <Link to={`/resume/${resume.id}/${generateResumeSlug(resume)}`} className="jact apply"><Phone size={14} /> 联系</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="jobs-empty"><User size={56} /><h3>暂无简历信息</h3><p>试试调整搜索条件或发布您的简历信息</p></div>
            )}
          </div>
        )}

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

      {editItem && (
        <div className="jobs-inline-form" ref={el => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          <div className="jobs-inline-card">
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
                  <div className="form-group"><label>公司名称</label><input name="company" defaultValue={editItem.company} /></div>
                  <div className="form-row">
                    <EditStateMultiSelect selected={editStates} onChange={setEditStates} />
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
                  <div className="form-group"><label>联系邮箱</label><input name="contactEmail" defaultValue={editItem.contactEmail} type="text" placeholder="选填" /></div>
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
                    <EditStateMultiSelect selected={editStates} onChange={setEditStates} label="期望州" />
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>联系电话</label><input name="phone" defaultValue={editItem.phone} required /></div>
                    <div className="form-group"><label>邮箱</label><input name="email" defaultValue={editItem.email} type="text" placeholder="选填" /></div>
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
    </div>
  );
};

export default Jobs;
