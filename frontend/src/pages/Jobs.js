import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Plus, 
  Filter,
  BookOpen,
  Briefcase,
  User,
  Phone,
  Mail,
  Calendar,
  X,
  Send,
  ChevronDown,
  Star,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PremiumPostModal from '../components/PremiumPostModal';
import './Jobs.css';

const Jobs = () => {
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' 或 'resumes'
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFormData, setCurrentFormData] = useState(null);
  
  const { user, isAuthenticated } = useAuth();
  
  // API基础URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  // 筛选条件状态
  const [filters, setFilters] = useState({
    category: '',       // 职位分类
    location: '',       // 工作地点
    workType: '',       // 工作类型（全职/兼职）
    experience: '',     // 工作经验
    publishTime: '',    // 发布时间
    salaryRange: ''     // 薪资范围
  });

  // 职位分类（根据用户图片）
  const jobCategories = [
    'CLASS A 司机',
    'CLASS B 司机', 
    'CLASS D 司机',
    '调度找召卡车',
    '文员OP',
    '跟单/客服',
    '应收应付会计',
    '卸柜搬货工',
    '出单出货 点数',
    '物流销售',
    '货运代理',
    '卡车修理技工',
    '货运经纪',
    '报关师'
  ];

  // 工作地点选项
  const locations = [
    '洛杉矶', '纽约', '旧金山', '芝加哥', '休斯顿', '凤凰城', 
    '费城', '圣安东尼奥', '圣地亚哥', '达拉斯', '圣何塞', '奥斯汀',
    '杰克逊维尔', '印第安纳波利斯', '旧金山湾区', '西雅图', '丹佛',
    '华盛顿', '波士顿', '纳什维尔', '巴尔的摩', '俄克拉荷马城',
    '路易斯维尔', '波特兰', '拉斯维加斯', '密尔沃基', '阿尔伯克基',
    '图森', '弗雷斯诺', '萨克拉门托', '堪萨斯城', '梅萨', '亚特兰大',
    '奥马哈', '科罗拉多斯普林斯', '罗利', '迈阿密', '克利夫兰',
    '弗吉尼亚海滩', '明尼阿波利斯', '新奥尔良'
  ];

  // 工作类型选项
  const workTypes = ['全职', '兼职', '合同工', '临时工'];

  // 工作经验选项
  const experienceOptions = ['经验不限', '1年以内', '1-3年', '3-5年', '5-10年', '10年以上'];

  // 发布时间选项
  const publishTimeOptions = ['全部时间', '今天', '3天内', '1周内', '1个月内'];

  // 薪资范围选项
  const salaryRanges = [
    '不限', '$2000以下', '$2000-$3000', '$3000-$4000', '$4000-$5000', 
    '$5000-$6000', '$6000-$8000', '$8000-$10000', '$10000以上'
  ];

  // 获取招聘职位数据
  const fetchJobs = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/jobs?${queryParams.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setJobs(result.data);
      } else {
        throw new Error(result.message || '获取职位数据失败');
      }
    } catch (error) {
      console.error('获取职位数据错误:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取简历数据
  const fetchResumes = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/resumes?${queryParams.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setResumes(result.data);
      } else {
        throw new Error(result.message || '获取简历数据失败');
      }
    } catch (error) {
      console.error('获取简历数据错误:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    } else {
      fetchResumes(); // 获取真实简历数据
    }
  }, [activeTab]);

  // 筛选函数
  const applyFilters = (items) => {
    return items.filter(item => {
      // 搜索关键词匹配
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          item.title?.toLowerCase().includes(searchLower) ||
          item.company?.toLowerCase().includes(searchLower) ||
          item.position?.toLowerCase().includes(searchLower) ||
          item.name?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // 职位分类筛选
      if (filters.category && item.category !== filters.category) return false;

      // 地点筛选
      if (filters.location && item.location !== filters.location) return false;

      // 工作类型筛选
      if (filters.workType && item.type !== filters.workType) return false;

      // 工作经验筛选
      if (filters.experience && item.experience !== filters.experience) return false;

      // 发布时间筛选
      if (filters.publishTime && filters.publishTime !== '全部时间') {
        const publishDate = new Date(item.publishDate);
        const now = new Date();
        const diffTime = Math.abs(now - publishDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.publishTime) {
          case '今天':
            if (diffDays > 1) return false;
            break;
          case '3天内':
            if (diffDays > 3) return false;
            break;
          case '1周内':
            if (diffDays > 7) return false;
            break;
          case '1个月内':
            if (diffDays > 30) return false;
            break;
        }
      }

      // 薪资范围筛选
      if (filters.salaryRange && filters.salaryRange !== '不限') {
        const itemSalary = item.salary || '';
        const salaryNum = parseInt(itemSalary.replace(/[^\d]/g, ''));
        
        switch (filters.salaryRange) {
          case '$2000以下':
            if (salaryNum >= 2000) return false;
            break;
          case '$2000-$3000':
            if (salaryNum < 2000 || salaryNum > 3000) return false;
            break;
          case '$3000-$4000':
            if (salaryNum < 3000 || salaryNum > 4000) return false;
            break;
          case '$4000-$5000':
            if (salaryNum < 4000 || salaryNum > 5000) return false;
            break;
          case '$5000-$6000':
            if (salaryNum < 5000 || salaryNum > 6000) return false;
            break;
          case '$6000-$8000':
            if (salaryNum < 6000 || salaryNum > 8000) return false;
            break;
          case '$8000-$10000':
            if (salaryNum < 8000 || salaryNum > 10000) return false;
            break;
          case '$10000以上':
            if (salaryNum < 10000) return false;
            break;
        }
      }

      return true;
    });
  };

  // 过滤数据
  const filteredJobs = applyFilters(jobs);
  const filteredResumes = applyFilters(resumes);

  // 处理筛选条件变化
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // 应用筛选条件
  useEffect(() => {
    if (activeTab === 'jobs') {
      const appliedFilters = {
        search: searchQuery,
        category: filters.category,
        location: filters.location,
        workType: filters.workType,
        experience: filters.experience
      };
      
      // 移除空值
      Object.keys(appliedFilters).forEach(key => {
        if (!appliedFilters[key]) delete appliedFilters[key];
      });
      
      fetchJobs(appliedFilters);
    }
  }, [searchQuery, filters, activeTab]);

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setFilters({
      category: '',
      location: '',
      workType: '',
      experience: '',
      publishTime: '',
      salaryRange: ''
    });
    setSearchQuery('');
  };

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = () => {
    return searchQuery || Object.values(filters).some(value => value !== '');
  };

  // 发布职位
  const handlePostJob = async (formData) => {
    try {
      if (!isAuthenticated) {
        alert('请先登录再发布职位');
        return;
      }

      setLoading(true);
      
      const authToken = localStorage.getItem('authToken');
      const jobData = {
        title: formData.get('title'),
        category: formData.get('category'),
        company: formData.get('company'),
        location: formData.get('location'),
        salary: formData.get('salary'),
        workType: formData.get('type'),
        experience: formData.get('experience'),
        description: formData.get('description'),
        contactPhone: formData.get('contactPhone'),
        contactEmail: formData.get('contactEmail'),
        contactPerson: formData.get('contactPerson')
      };

      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(jobData)
      });

      const result = await response.json();

      if (result.success) {
        setShowPostModal(false);
        fetchJobs(); // 重新获取职位列表
        alert('职位发布成功！');
      } else {
        // 处理验证错误，显示具体错误信息
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map(error => error.msg).join('\n');
          throw new Error(`请检查以下信息：\n${errorMessages}`);
        } else {
          throw new Error(result.message || '发布失败');
        }
      }
    } catch (error) {
      console.error('发布职位错误:', error);
      alert('发布失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 发布简历
  const handlePostResume = async (formData) => {
    try {
      if (!isAuthenticated) {
        alert('请先登录后再发布简历');
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('认证信息已过期，请重新登录');
        return;
      }

      const resumeData = {
        name: formData.get('name'),
        position: formData.get('position'),
        experience: formData.get('experience'),
        location: formData.get('location'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        skills: formData.get('skills'),
        summary: formData.get('summary'),
        expectedSalary: formData.get('expectedSalary'),
        workTypePreference: formData.get('workTypePreference')
      };

      const response = await fetch(`${API_BASE_URL}/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resumeData)
      });

      const result = await response.json();

      if (result.success) {
        alert('简历发布成功！');
        setShowPostModal(false);
        // 重新获取简历列表
        await fetchResumes();
      } else {
        // 处理验证错误，显示具体错误信息
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map(error => error.msg).join('\n');
          throw new Error(`请检查以下信息：\n${errorMessages}`);
        } else {
          throw new Error(result.message || '发布简历失败');
        }
      }
    } catch (error) {
      console.error('发布简历错误:', error);
      alert(`发布简历失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 统一发布处理函数（先显示积分模态框）
  const handlePost = (formData) => {
    if (!isAuthenticated) {
      alert('请先登录再发布');
      return;
    }

    // 收集表单数据并显示积分模态框
    const formDataObj = {};
    for (let [key, value] of formData.entries()) {
      formDataObj[key] = value;
    }
    
    setCurrentFormData(formDataObj);
    setShowPostModal(false);
    setShowPremiumModal(true);
  };

  // 确认发布函数
  const handleConfirmPost = async ({ formData, premium }) => {
    try {
      setLoading(true);

      const authToken = localStorage.getItem('authToken');
      const postData = {
        ...formData,
        premium: premium
      };

      const endpoint = activeTab === 'jobs' ? '/api/jobs' : '/api/resumes';
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (result.success) {
        setShowPremiumModal(false);
        setCurrentFormData(null);
        if (activeTab === 'jobs') {
          fetchJobs();
        } else {
          fetchResumes();
        }
        
        const typeName = activeTab === 'jobs' ? '职位' : '简历';
        alert(`${typeName}发布成功！已扣除 ${result.creditsSpent} 积分`);
      } else {
        throw new Error(result.message || '发布失败');
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 电话联系
  const handlePhoneContact = (job) => {
    if (job.contactPhone) {
      const confirmed = window.confirm(
        `确定要拨打电话联系招聘方吗？\n\n联系人: ${job.contactPerson || '招聘负责人'}\n电话: ${job.contactPhone}\n公司: ${job.company}\n职位: ${job.title}`
      );
      if (confirmed) {
        window.open(`tel:${job.contactPhone}`);
      }
    } else {
      alert('该职位未提供联系电话');
    }
  };

  // 邮件联系
  const handleEmailContact = (job) => {
    if (job.contactEmail) {
      const subject = encodeURIComponent(`应聘职位: ${job.title} - ${job.company}`);
      const body = encodeURIComponent(
        `您好，${job.contactPerson || '招聘负责人'}：\n\n我对贵公司发布的"${job.title}"职位很感兴趣，希望能够申请该职位。\n\n职位信息：\n- 公司：${job.company}\n- 地点：${job.location}\n- 薪资：${job.salary}\n\n请问是否方便安排面试？期待您的回复。\n\n谢谢！`
      );
      
      const confirmed = window.confirm(
        `确定要发送邮件联系招聘方吗？\n\n联系人: ${job.contactPerson || '招聘负责人'}\n邮箱: ${job.contactEmail}\n公司: ${job.company}\n职位: ${job.title}`
      );
      
      if (confirmed) {
        window.open(`mailto:${job.contactEmail}?subject=${subject}&body=${body}`);
      }
    } else {
      alert('该职位未提供联系邮箱');
    }
  };

  // 电话联系求职者
  const handlePhoneContactResume = (resume) => {
    if (resume.phone) {
      const confirmed = window.confirm(
        `确定要拨打电话联系求职者吗？\n\n姓名: ${resume.name}\n电话: ${resume.phone}\n求职职位: ${resume.position}\n工作经验: ${resume.experience}\n期望地点: ${resume.location}`
      );
      if (confirmed) {
        window.open(`tel:${resume.phone}`);
      }
    } else {
      alert('该求职者未提供联系电话');
    }
  };

  // 邮件联系求职者
  const handleEmailContactResume = (resume) => {
    if (resume.email) {
      const subject = encodeURIComponent(`关于您的求职申请: ${resume.position}`);
      const body = encodeURIComponent(
        `您好，${resume.name}：\n\n我是招聘负责人，看到您在平台上发布的求职简历，对您的背景很感兴趣。\n\n您的求职信息：\n- 求职职位：${resume.position}\n- 工作经验：${resume.experience}\n- 期望地点：${resume.location}\n- 技能专长：${resume.skills ? resume.skills.join(', ') : '未提供'}\n\n请问您是否有兴趣了解更多工作机会？期待您的回复。\n\n谢谢！`
      );
      
      const confirmed = window.confirm(
        `确定要发送邮件联系求职者吗？\n\n姓名: ${resume.name}\n邮箱: ${resume.email}\n求职职位: ${resume.position}\n工作经验: ${resume.experience}`
      );
      
      if (confirmed) {
        window.open(`mailto:${resume.email}?subject=${subject}&body=${body}`);
      }
    } else {
      alert('该求职者未提供联系邮箱');
    }
  };

  return (
    <div className="jobs-page">
      {/* 页面头部 */}
      <div className="page-header-jobs">
        <div className="header-content">
          <h1>招聘求职</h1>
          <p>连接物流企业与专业人才</p>
        </div>
      </div>

      {/* 切换标签 */}
      <div className="tab-switcher">
        <button 
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <Briefcase size={20} />
          招聘职位
        </button>
        <button 
          className={`tab-button ${activeTab === 'resumes' ? 'active' : ''}`}
          onClick={() => setActiveTab('resumes')}
        >
          <User size={20} />
          求职简历
        </button>
      </div>

      {/* 搜索和控制区域 */}
      <div className="controls-section">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder={activeTab === 'jobs' ? '搜索职位或公司...' : '搜索求职者或职位...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="control-buttons">
          <button 
            className={`filter-button ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            筛选
            <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
          </button>
          
          <button 
            className="post-button"
            onClick={() => setShowPostModal(true)}
          >
            <Plus size={20} />
            {activeTab === 'jobs' ? '发布职位' : '发布简历'}
          </button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            {activeTab === 'jobs' && (
              <div className="filter-group">
                <label>职位分类</label>
                <select 
                  value={filters.category} 
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">全部分类</option>
                  {jobCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-group">
              <label>工作地点</label>
              <select 
                value={filters.location} 
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <option value="">全部地点</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>工作类型</label>
              <select 
                value={filters.workType} 
                onChange={(e) => handleFilterChange('workType', e.target.value)}
              >
                <option value="">全部类型</option>
                {workTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>工作经验</label>
              <select 
                value={filters.experience} 
                onChange={(e) => handleFilterChange('experience', e.target.value)}
              >
                <option value="">全部经验</option>
                {experienceOptions.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>发布时间</label>
              <select 
                value={filters.publishTime} 
                onChange={(e) => handleFilterChange('publishTime', e.target.value)}
              >
                <option value="">全部时间</option>
                {publishTimeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {activeTab === 'jobs' && (
              <div className="filter-group">
                <label>薪资范围</label>
                <select 
                  value={filters.salaryRange} 
                  onChange={(e) => handleFilterChange('salaryRange', e.target.value)}
                >
                  <option value="">全部薪资</option>
                  {salaryRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {hasActiveFilters() && (
            <div className="filter-actions">
              <span className="filter-count">
                找到 {activeTab === 'jobs' ? filteredJobs.length : filteredResumes.length} 条结果
              </span>
              <button className="clear-filters" onClick={clearAllFilters}>
                清除筛选
              </button>
            </div>
          )}
        </div>
      )}

      {/* 内容区域 */}
      <div className="content-area">
        {activeTab === 'jobs' ? (
          <div className="jobs-list">
            {filteredJobs.map(job => (
              <div key={job.id} className={`job-card${job.is_premium ? ' premium-post' : ''}${job.premium_type === 'top' ? ' premium-top' : ''}${job.premium_type === 'highlight' ? ' premium-highlight' : ''}`}>
                {/* Premium标识 */}
                {job.premium_type === 'top' && (
                  <div className="premium-badge premium-top-badge">
                    <Star size={14} fill="currentColor" />
                    置顶
                  </div>
                )}
                {job.premium_type === 'highlight' && (
                  <div className="premium-overlay"></div>
                )}
                
                <div className="job-header">
                  <div className="job-title">
                    <h3>{job.title}</h3>
                    <span className="company-name">{job.company}</span>
                    {job.category && (
                      <span className="job-category">{job.category}</span>
                    )}
                  </div>
                  <div className="job-salary">{job.salary}</div>
                </div>
                
                <div className="job-details">
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span>{job.location}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>{job.type}</span>
                  </div>
                  <div className="detail-item">
                    <BookOpen size={16} />
                    <span>{job.experience}</span>
                  </div>
                  <div className="detail-item posted">
                    <Calendar size={16} />
                    <span>{job.posted}</span>
                  </div>
                </div>

                <p className="job-description">{job.description}</p>
                
                <div className="job-actions">
                  <button className="apply-btn">
                    <Send size={16} />
                    立即申请
                  </button>
                  <button className="save-btn">
                    <Bookmark size={16} />
                    收藏职位
                  </button>
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div className="empty-state">
                <Briefcase size={64} />
                <h3>暂无职位信息</h3>
                <p>试试调整搜索条件或发布您的招聘需求</p>
              </div>
            )}
          </div>
        ) : (
          <div className="resumes-list">
            {filteredResumes.map(resume => (
              <div key={resume.id} className={`resume-card${resume.is_premium ? ' premium-post' : ''}${resume.premium_type === 'top' ? ' premium-top' : ''}${resume.premium_type === 'highlight' ? ' premium-highlight' : ''}`}>
                {/* Premium标识 */}
                {resume.premium_type === 'top' && (
                  <div className="premium-badge premium-top-badge">
                    <Star size={14} fill="currentColor" />
                    置顶
                  </div>
                )}
                {resume.premium_type === 'highlight' && (
                  <div className="premium-overlay"></div>
                )}
                
                <div className="resume-header">
                  <div className="resume-basic">
                    <h3>{resume.name}</h3>
                    <span className="position">{resume.position}</span>
                    <span className="experience">{resume.experience}</span>
                  </div>
                  <div className="resume-location">
                    <MapPin size={16} />
                    <span>{resume.location}</span>
                  </div>
                </div>

                <div className="resume-contact">
                  <div className="contact-item">
                    <Phone size={16} />
                    <span>{resume.phone}</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={16} />
                    <span>{resume.email}</span>
                  </div>
                  <div className="contact-item posted">
                    <Calendar size={16} />
                    <span>{resume.posted}</span>
                  </div>
                </div>

                <div className="resume-skills">
                  {resume.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
                
                <div className="resume-actions">
                  <button className="contact-btn">
                    <Phone size={16} />
                    联系求职者
                  </button>
                  <button className="save-btn">
                    <Bookmark size={16} />
                    收藏简历
                  </button>
                </div>
              </div>
            ))}

            {filteredResumes.length === 0 && (
              <div className="empty-state">
                <User size={64} />
                <h3>暂无简历信息</h3>
                <p>试试调整搜索条件或发布您的简历信息</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 发布模态框 */}
      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{activeTab === 'jobs' ? '发布招聘职位' : '发布求职简历'}</h2>
              <button onClick={() => setShowPostModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handlePost(new FormData(e.target));
            }}>
              <div className="modal-body">
                {activeTab === 'jobs' ? (
                  <>
                    <div className="form-group">
                      <label>职位名称 *</label>
                      <input type="text" name="title" required placeholder="如：CLASS A 司机" />
                    </div>
                    
                    <div className="form-group">
                      <label>职位分类 *</label>
                      <select name="category" required>
                        <option value="">请选择职位分类</option>
                        {jobCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>公司名称 *</label>
                      <input type="text" name="company" required placeholder="如：顺丰速运" />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>工作地点 *</label>
                        <select name="location" required>
                          <option value="">请选择工作地点</option>
                          {locations.map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>薪资待遇 *</label>
                        <input type="text" name="salary" required placeholder="如：$4000-6000/月" />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>工作类型 *</label>
                        <select name="type" required>
                          <option value="">请选择</option>
                          {workTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>经验要求 *</label>
                        <select name="experience" required>
                          <option value="">请选择</option>
                          {experienceOptions.map(exp => (
                            <option key={exp} value={exp}>{exp}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>职位描述 *</label>
                      <textarea name="description" required placeholder="详细描述职位要求、工作内容、福利待遇等..."></textarea>
                    </div>
                    
                    <div className="form-group">
                      <label>联系信息</label>
                      <div className="form-row">
                        <div className="form-group">
                          <label>联系人姓名</label>
                          <input type="text" name="contactPerson" placeholder="如：张经理" />
                        </div>
                        <div className="form-group">
                          <label>联系电话 *</label>
                          <input type="tel" name="contactPhone" required placeholder="如：(323) 888-1001" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>联系邮箱 *</label>
                        <input type="email" name="contactEmail" required placeholder="如：hr@company.com" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>姓名 *</label>
                      <input type="text" name="name" required placeholder="如：张三" />
                    </div>
                    <div className="form-group">
                      <label>求职岗位 *</label>
                      <input type="text" name="position" required placeholder="如：CLASS A 司机" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>工作经验 *</label>
                        <select name="experience" required>
                          <option value="">请选择</option>
                          {experienceOptions.map(exp => (
                            <option key={exp} value={exp}>{exp}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>期望地点 *</label>
                        <select name="location" required>
                          <option value="">请选择期望地点</option>
                          {locations.map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>联系电话 *</label>
                        <input type="tel" name="phone" required placeholder="如：(123) 456-7890" />
                      </div>
                      <div className="form-group">
                        <label>邮箱地址 *</label>
                        <input type="email" name="email" required placeholder="如：zhangsan@email.com" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>技能专长 *</label>
                      <input type="text" name="skills" required placeholder="请用逗号分隔，如：CDL-A驾照, 长途运输, 货物装卸" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>期望薪资</label>
                        <input type="text" name="expectedSalary" placeholder="如：$4000-5000/月" />
                      </div>
                      <div className="form-group">
                        <label>工作类型偏好</label>
                        <select name="workTypePreference">
                          <option value="">请选择</option>
                          {workTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>个人简介</label>
                      <textarea name="summary" placeholder="简要介绍您的工作经验、技能优势等..."></textarea>
                    </div>
                  </>
                )}
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowPostModal(false)}>
                  取消
                </button>
                <button type="submit" className="submit-button">
                  <Send size={16} />
                  发布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 积分发布模态框 */}
      <PremiumPostModal
        isOpen={showPremiumModal}
        onClose={() => {
          setShowPremiumModal(false);
          setCurrentFormData(null);
        }}
        onConfirm={handleConfirmPost}
        postType={activeTab === 'jobs' ? 'job' : 'resume'}
        formData={currentFormData}
      />
    </div>
  );
};

export default Jobs; 