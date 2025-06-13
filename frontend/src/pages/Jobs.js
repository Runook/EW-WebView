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
  ChevronDown
} from 'lucide-react';
import './Jobs.css';

const Jobs = () => {
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' 或 'resumes'
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);

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

  // 模拟招聘数据（更丰富的数据）
  const mockJobs = [
    {
      id: 1,
      title: 'CLASS A 司机',
      category: 'CLASS A 司机',
      company: '顺丰速运',
      location: '洛杉矶',
      salary: '$4000-6000/月',
      type: '全职',
      experience: '1-3年',
      posted: '2天前',
      publishDate: '2024-01-10',
      description: '负责长途货物运输，要求有CDL-A驾照，工作稳定，福利待遇好'
    },
    {
      id: 2,
      title: '仓库管理员',
      category: '文员OP',
      company: '亚马逊物流',
      location: '纽约',
      salary: '$3500-5000/月',
      type: '全职',
      experience: '经验不限',
      posted: '1天前',
      publishDate: '2024-01-11',
      description: '负责仓库日常管理，货物入库出库，熟悉仓储系统优先'
    },
    {
      id: 3,
      title: '客服专员',
      category: '跟单/客服',
      company: '联邦快递',
      location: '旧金山',
      salary: '$3000-4500/月',
      type: '全职',
      experience: '1年以内',
      posted: '3天前',
      publishDate: '2024-01-09',
      description: '处理客户咨询，协调物流问题，中英文流利'
    },
    {
      id: 4,
      title: 'CLASS B 司机',
      category: 'CLASS B 司机',
      company: '优速快递',
      location: '芝加哥',
      salary: '$3000-4500/月',
      type: '全职',
      experience: '1-3年',
      posted: '1天前',
      publishDate: '2024-01-11',
      description: '负责城市配送，要求有CDL-B驾照，熟悉当地路况'
    },
    {
      id: 5,
      title: '应收应付会计',
      category: '应收应付会计',
      company: '中通快运',
      location: '休斯顿',
      salary: '$4500-6000/月',
      type: '全职',
      experience: '3-5年',
      posted: '5天前',
      publishDate: '2024-01-07',
      description: '负责公司应收应付账款管理，要求有会计证书'
    },
    {
      id: 6,
      title: '货运代理',
      category: '货运代理',
      company: '德邦物流',
      location: '凤凰城',
      salary: '$3500-5500/月',
      type: '兼职',
      experience: '1-3年',
      posted: '4天前',
      publishDate: '2024-01-08',
      description: '负责货运业务开发，客户维护，有相关经验优先'
    },
    {
      id: 7,
      title: 'CLASS D 司机',
      category: 'CLASS D 司机',
      company: '韵达快递',
      location: '费城',
      salary: '$2500-3500/月',
      type: '兼职',
      experience: '经验不限',
      posted: '6天前',
      publishDate: '2024-01-06',
      description: '负责小件包裹配送，时间灵活，适合兼职'
    },
    {
      id: 8,
      title: '调度找召卡车',
      category: '调度找召卡车',
      company: '圆通速递',
      location: '圣安东尼奥',
      salary: '$3800-5200/月',
      type: '全职',
      experience: '3-5年',
      posted: '1周前',
      publishDate: '2024-01-05',
      description: '负责车辆调度，货物配载，要求有丰富调度经验'
    }
  ];

  // 模拟简历数据
  const mockResumes = [
    {
      id: 1,
      name: '张三',
      position: 'CLASS A 司机',
      experience: '5年经验',
      location: '洛杉矶',
      phone: '(123) 456-7890',
      email: 'zhangsan@email.com',
      posted: '1天前',
      publishDate: '2024-01-11',
      skills: ['CDL-A驾照', '长途运输', '货物装卸']
    },
    {
      id: 2,
      name: '李四',
      position: '仓库主管',
      experience: '8年经验',
      location: '纽约',
      phone: '(234) 567-8901',
      email: 'lisi@email.com',
      posted: '2天前',
      publishDate: '2024-01-10',
      skills: ['仓储管理', 'WMS系统', '团队管理']
    },
    {
      id: 3,
      name: '王五',
      position: '货运代理',
      experience: '3年经验',
      location: '旧金山',
      phone: '(345) 678-9012',
      email: 'wangwu@email.com',
      posted: '3天前',
      publishDate: '2024-01-09',
      skills: ['客户开发', '业务谈判', '英语流利']
    }
  ];

  useEffect(() => {
    setJobs(mockJobs);
    setResumes(mockResumes);
  }, []);

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

  // 发布职位/简历
  const handlePost = (formData) => {
    if (activeTab === 'jobs') {
      const newJob = {
        id: jobs.length + 1,
        title: formData.get('title'),
        category: formData.get('category'),
        company: formData.get('company'),
        location: formData.get('location'),
        salary: formData.get('salary'),
        type: formData.get('type'),
        experience: formData.get('experience'),
        description: formData.get('description'),
        posted: '刚刚',
        publishDate: new Date().toISOString().split('T')[0]
      };
      setJobs([newJob, ...jobs]);
    } else {
      const newResume = {
        id: resumes.length + 1,
        name: formData.get('name'),
        position: formData.get('position'),
        experience: formData.get('experience'),
        location: formData.get('location'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        skills: formData.get('skills').split(',').map(s => s.trim()),
        posted: '刚刚',
        publishDate: new Date().toISOString().split('T')[0]
      };
      setResumes([newResume, ...resumes]);
    }
    setShowPostModal(false);
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
              <div key={job.id} className="job-card">
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
                  <button className="apply-button">立即申请</button>
                  <button className="contact-button">联系HR</button>
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
              <div key={resume.id} className="resume-card">
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
                  <button className="contact-button">联系求职者</button>
                  <button className="view-button">查看详情</button>
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
    </div>
  );
};

export default Jobs; 