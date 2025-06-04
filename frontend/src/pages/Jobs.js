import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Briefcase,
  GraduationCap,
  Users,
  Building,
  Plus,
  Send,
  Eye,
  Heart,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './Jobs.css';

const Jobs = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('jobs'); // jobs 或 resumes
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    position: '',
    city: '',
    experience: '',
    education: '',
    salaryRange: '',
    company: ''
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishType, setPublishType] = useState('job'); // job 或 resume

  // 工作经验要求
  const experienceOptions = [
    '不限', '应届毕业生', '1年以下', '1-3年', '3-5年', '5-10年', '10年以上'
  ];

  // 学历要求
  const educationOptions = [
    '不限', '高中/中专', '大专', '本科', '硕士', '博士'
  ];

  // 薪资范围
  const salaryRanges = [
    '不限', '3k以下', '3-5k', '5-8k', '8-12k', '12-20k', '20-30k', '30k以上'
  ];

  // 模拟职位数据
  const mockJobs = [
    {
      id: 1,
      title: '物流运营经理',
      company: '东方物流集团',
      logo: '/api/placeholder/60/60',
      city: '上海',
      district: '浦东新区',
      salary: '15-25k',
      experience: '3-5年',
      education: '本科',
      jobType: '全职',
      urgent: true,
      description: '负责物流运营管理，包括仓储、配送、运输等环节的协调和优化',
      requirements: [
        '物流管理、供应链管理相关专业',
        '3年以上物流行业工作经验',
        '熟悉WMS、TMS等物流系统',
        '具备良好的沟通协调能力'
      ],
      welfare: ['五险一金', '带薪年假', '绩效奖金', '培训机会'],
      publishDate: '2024-01-01',
      views: 1234,
      applications: 45,
      hr: {
        name: '张经理',
        position: 'HR总监',
        responseRate: '90%',
        responseTime: '2小时内'
      }
    },
    {
      id: 2,
      title: '货运司机',
      company: '快速运输有限公司',
      logo: '/api/placeholder/60/60',
      city: '北京',
      district: '朝阳区',
      salary: '8-12k',
      experience: '1-3年',
      education: '高中/中专',
      jobType: '全职',
      urgent: false,
      description: '负责货物运输，确保货物安全准时到达目的地',
      requirements: [
        '持有A2或B2驾驶证',
        '2年以上货运经验',
        '熟悉华北地区路线',
        '无重大交通违法记录'
      ],
      welfare: ['五险', '餐补', '车辆保养', '节日福利'],
      publishDate: '2024-01-02',
      views: 856,
      applications: 23,
      hr: {
        name: '李主管',
        position: '运营主管',
        responseRate: '85%',
        responseTime: '4小时内'
      }
    },
    {
      id: 3,
      title: '仓库管理员',
      company: '智慧仓储科技',
      logo: '/api/placeholder/60/60',
      city: '深圳',
      district: '宝安区',
      salary: '6-9k',
      experience: '1年以下',
      education: '大专',
      jobType: '全职',
      urgent: false,
      description: '负责仓库日常管理，包括入库、出库、盘点等工作',
      requirements: [
        '物流管理或相关专业',
        '熟悉仓库管理流程',
        '具备基本的计算机操作能力',
        '责任心强，细心认真'
      ],
      welfare: ['五险', '包住', '餐补', '加班费'],
      publishDate: '2024-01-03',
      views: 642,
      applications: 18,
      hr: {
        name: '王总监',
        position: '仓储总监',
        responseRate: '95%',
        responseTime: '1小时内'
      }
    }
  ];

  // 模拟简历数据
  const mockResumes = [
    {
      id: 1,
      name: '李明',
      age: 28,
      gender: '男',
      education: '本科',
      major: '物流管理',
      experience: '5年',
      currentPosition: '物流专员',
      expectedPosition: '物流主管/经理',
      expectedSalary: '12-18k',
      city: '上海',
      skills: ['WMS系统', 'TMS系统', '数据分析', '团队管理'],
      workHistory: [
        {
          company: '顺丰速运',
          position: '物流专员',
          duration: '2021-2024',
          description: '负责华东区域物流网点管理，优化配送路线'
        }
      ],
      avatar: '/api/placeholder/60/60',
      updateTime: '2024-01-01',
      views: 89,
      status: '求职中'
    },
    {
      id: 2,
      name: '王芳',
      age: 25,
      gender: '女',
      education: '大专',
      major: '国际贸易',
      experience: '2年',
      currentPosition: '货代专员',
      expectedPosition: '货代主管',
      expectedSalary: '8-12k',
      city: '深圳',
      skills: ['报关报检', '英语', '客户服务', '海运操作'],
      workHistory: [
        {
          company: '中外运',
          position: '货代专员',
          duration: '2022-2024',
          description: '负责中美海运线路操作，处理进出口业务'
        }
      ],
      avatar: '/api/placeholder/60/60',
      updateTime: '2024-01-02',
      views: 65,
      status: '求职中'
    }
  ];

  // 页面加载时获取数据
  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    } else {
      fetchResumes();
    }
  }, [activeTab]);

  // 获取职位列表 - API接口
  const fetchJobs = async () => {
    setLoading(true);
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch('/api/jobs/list', {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      // const data = await response.json();
      
      setTimeout(() => {
        setJobs(mockJobs);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取职位列表失败:', error);
      setLoading(false);
    }
  };

  // 获取简历列表 - API接口
  const fetchResumes = async () => {
    setLoading(true);
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch('/api/resumes/list', {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      // const data = await response.json();
      
      setTimeout(() => {
        setResumes(mockResumes);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取简历列表失败:', error);
      setLoading(false);
    }
  };

  // 搜索职位/简历 - API接口
  const searchItems = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'jobs' ? '/api/jobs/search' : '/api/resumes/search';
      // TODO: 替换为真实API调用
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     query: searchQuery,
      //     filters: filters
      //   })
      // });
      // const data = await response.json();
      
      // 模拟搜索逻辑
      const sourceData = activeTab === 'jobs' ? mockJobs : mockResumes;
      let filteredData = sourceData;
      
      if (searchQuery) {
        filteredData = filteredData.filter(item => {
          if (activeTab === 'jobs') {
            return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   item.company.toLowerCase().includes(searchQuery.toLowerCase());
          } else {
            return item.expectedPosition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   item.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
          }
        });
      }
      
      setTimeout(() => {
        if (activeTab === 'jobs') {
          setJobs(filteredData);
        } else {
          setResumes(filteredData);
        }
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('搜索失败:', error);
      setLoading(false);
    }
  };

  // 申请职位 - API接口
  const applyJob = async (jobId) => {
    try {
      // TODO: 替换为真实API调用
      // const response = await fetch(`/api/jobs/${jobId}/apply`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     resumeId: 'userResumeId',
      //     coverLetter: 'coverLetterText'
      //   })
      // });
      
      console.log('申请职位:', jobId);
      alert('申请已提交，请等待HR回复');
    } catch (error) {
      console.error('申请职位失败:', error);
    }
  };

  // 收藏职位/简历 - API接口
  const favoriteItem = async (itemId, type) => {
    try {
      const endpoint = type === 'job' ? `/api/jobs/${itemId}/favorite` : `/api/resumes/${itemId}/favorite`;
      // TODO: 替换为真实API调用
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      
      console.log('收藏:', type, itemId);
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  // 发布职位/简历 - API接口
  const publishItem = async (itemData, type) => {
    try {
      const endpoint = type === 'job' ? '/api/jobs' : '/api/resumes';
      // TODO: 替换为真实API调用
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(itemData)
      // });
      
      console.log('发布:', type, itemData);
      setShowPublishModal(false);
      // 刷新列表
      if (type === 'job') {
        fetchJobs();
      } else {
        fetchResumes();
      }
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  const handleSearch = () => {
    searchItems();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setFilters({
      position: '',
      city: '',
      experience: '',
      education: '',
      salaryRange: '',
      company: ''
    });
  };

  return (
    <div className="jobs-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="container">
          <h1>招聘求职</h1>
          <p>物流企业发布招聘信息，求职者发布简历信息，提供精准的人才匹配服务</p>
        </div>
      </div>

      <div className="container">
        {/* 标签切换 */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => handleTabChange('jobs')}
          >
            <Briefcase size={20} />
            职位招聘
          </button>
          <button 
            className={`tab-btn ${activeTab === 'resumes' ? 'active' : ''}`}
            onClick={() => handleTabChange('resumes')}
          >
            <Users size={20} />
            人才简历
          </button>
        </div>
      </div>

      {/* 搜索区域 */}
      <div className="search-section">
        <div className="container">
          <div className="search-bar">
            <div className="search-input-group">
              <Search size={20} />
              <input
                type="text"
                placeholder={
                  activeTab === 'jobs' 
                    ? "搜索职位名称、公司名称或关键词" 
                    : "搜索期望职位、技能或关键词"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch}>
                搜索
              </button>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="filters">
            <input
              type="text"
              placeholder="城市"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
            />

            <select 
              value={filters.experience} 
              onChange={(e) => setFilters({...filters, experience: e.target.value})}
            >
              <option value="">工作经验</option>
              {experienceOptions.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>

            <select 
              value={filters.education} 
              onChange={(e) => setFilters({...filters, education: e.target.value})}
            >
              <option value="">学历要求</option>
              {educationOptions.map(edu => (
                <option key={edu} value={edu}>{edu}</option>
              ))}
            </select>

            <select 
              value={filters.salaryRange} 
              onChange={(e) => setFilters({...filters, salaryRange: e.target.value})}
            >
              <option value="">薪资范围</option>
              {salaryRanges.map(salary => (
                <option key={salary} value={salary}>{salary}</option>
              ))}
            </select>
          </div>

          {/* 发布按钮 */}
          <div className="publish-section">
            <button 
              className="publish-btn"
              onClick={() => {
                setPublishType(activeTab === 'jobs' ? 'job' : 'resume');
                setShowPublishModal(true);
              }}
            >
              <Plus size={20} />
              {activeTab === 'jobs' ? '发布职位' : '发布简历'}
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* 内容区域 */}
        {activeTab === 'jobs' ? (
          // 职位列表
          <div className="jobs-list">
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>加载中...</p>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <img src={job.logo} alt={job.company} className="company-logo" />
                    <div className="job-basic">
                      <div className="job-title">
                        <h3>{job.title}</h3>
                        {job.urgent && <span className="urgent-tag">急聘</span>}
                      </div>
                      <div className="company-name">{job.company}</div>
                    </div>
                    <div className="job-salary">{job.salary}</div>
                  </div>

                  <div className="job-info">
                    <div className="job-details">
                      <span><MapPin size={14} /> {job.city} · {job.district}</span>
                      <span><Briefcase size={14} /> {job.experience}</span>
                      <span><GraduationCap size={14} /> {job.education}</span>
                      <span><Clock size={14} /> {job.jobType}</span>
                    </div>

                    <p className="job-description">{job.description}</p>

                    <div className="job-welfare">
                      {job.welfare.map(item => (
                        <span key={item} className="welfare-tag">{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="job-footer">
                    <div className="job-stats">
                      <span><Calendar size={14} /> {job.publishDate}</span>
                      <span><Eye size={14} /> {job.views}浏览</span>
                      <span><Send size={14} /> {job.applications}申请</span>
                    </div>
                    
                    <div className="job-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => favoriteItem(job.id, 'job')}
                      >
                        <Heart size={16} />
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => setSelectedJob(job)}
                      >
                        查看详情
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={() => applyJob(job.id)}
                      >
                        立即申请
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // 简历列表
          <div className="resumes-list">
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>加载中...</p>
              </div>
            ) : (
              resumes.map(resume => (
                <div key={resume.id} className="resume-card">
                  <div className="resume-header">
                    <img src={resume.avatar} alt={resume.name} className="avatar" />
                    <div className="resume-basic">
                      <div className="name-age">
                        <h3>{resume.name}</h3>
                        <span>{resume.age}岁 · {resume.gender}</span>
                      </div>
                      <div className="education-major">
                        {resume.education} · {resume.major}
                      </div>
                    </div>
                    <div className="resume-status">
                      <span className="status-tag">{resume.status}</span>
                    </div>
                  </div>

                  <div className="resume-info">
                    <div className="resume-details">
                      <span><Briefcase size={14} /> {resume.experience}经验</span>
                      <span><MapPin size={14} /> {resume.city}</span>
                      <span><DollarSign size={14} /> {resume.expectedSalary}</span>
                    </div>

                    <div className="expected-position">
                      期望职位：{resume.expectedPosition}
                    </div>

                    <div className="skills">
                      {resume.skills.map(skill => (
                        <span key={skill} className="skill-tag">{skill}</span>
                      ))}
                    </div>

                    {resume.workHistory.length > 0 && (
                      <div className="work-history">
                        <div className="work-item">
                          <strong>{resume.workHistory[0].company}</strong> · {resume.workHistory[0].position}
                          <span className="duration">({resume.workHistory[0].duration})</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="resume-footer">
                    <div className="resume-stats">
                      <span><Calendar size={14} /> 更新于 {resume.updateTime}</span>
                      <span><Eye size={14} /> {resume.views}浏览</span>
                    </div>
                    
                    <div className="resume-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => favoriteItem(resume.id, 'resume')}
                      >
                        <Heart size={16} />
                      </button>
                      <button className="btn-primary">
                        联系候选人
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 空状态 */}
        {((activeTab === 'jobs' && jobs.length === 0) || 
          (activeTab === 'resumes' && resumes.length === 0)) && !loading && (
          <div className="no-results">
            {activeTab === 'jobs' ? <Briefcase size={64} /> : <Users size={64} />}
            <h3>暂无{activeTab === 'jobs' ? '职位' : '简历'}信息</h3>
            <p>试试调整搜索条件或发布您的{activeTab === 'jobs' ? '招聘需求' : '简历信息'}</p>
          </div>
        )}
      </div>

      {/* 职位详情模态框 */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content job-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="job-detail-content">
                <div className="job-main-info">
                  <div className="company-info">
                    <img src={selectedJob.logo} alt={selectedJob.company} />
                    <div>
                      <h3>{selectedJob.company}</h3>
                      <p>{selectedJob.city} · {selectedJob.district}</p>
                    </div>
                  </div>
                  
                  <div className="job-summary">
                    <div className="salary-big">{selectedJob.salary}</div>
                    <div className="job-tags">
                      <span>{selectedJob.experience}</span>
                      <span>{selectedJob.education}</span>
                      <span>{selectedJob.jobType}</span>
                    </div>
                  </div>
                </div>

                <div className="job-sections">
                  <div className="section">
                    <h4>职位描述</h4>
                    <p>{selectedJob.description}</p>
                  </div>

                  <div className="section">
                    <h4>任职要求</h4>
                    <ul>
                      {selectedJob.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="section">
                    <h4>福利待遇</h4>
                    <div className="welfare-list">
                      {selectedJob.welfare.map(item => (
                        <span key={item} className="welfare-tag">{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="section">
                    <h4>HR信息</h4>
                    <div className="hr-info">
                      <div className="hr-basic">
                        <strong>{selectedJob.hr.name}</strong> · {selectedJob.hr.position}
                      </div>
                      <div className="hr-stats">
                        <span>回复率：{selectedJob.hr.responseRate}</span>
                        <span>回复时间：{selectedJob.hr.responseTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="apply-section">
                  <button 
                    className="btn-primary btn-large"
                    onClick={() => applyJob(selectedJob.id)}
                  >
                    立即申请
                  </button>
                  <button 
                    className="btn-icon"
                    onClick={() => favoriteItem(selectedJob.id, 'job')}
                  >
                    <Heart size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 发布模态框 */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="modal-content publish-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{publishType === 'job' ? '发布职位' : '发布简历'}</h2>
              <button onClick={() => setShowPublishModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {publishType === 'job' ? (
                <div className="publish-form">
                  <div className="form-group">
                    <label>职位名称</label>
                    <input type="text" placeholder="请输入职位名称" />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>工作城市</label>
                      <input type="text" placeholder="请输入工作城市" />
                    </div>
                    <div className="form-group">
                      <label>薪资范围</label>
                      <select>
                        {salaryRanges.slice(1).map(salary => (
                          <option key={salary} value={salary}>{salary}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>工作经验</label>
                      <select>
                        {experienceOptions.map(exp => (
                          <option key={exp} value={exp}>{exp}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>学历要求</label>
                      <select>
                        {educationOptions.map(edu => (
                          <option key={edu} value={edu}>{edu}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>职位描述</label>
                    <textarea placeholder="请详细描述职位职责和工作内容"></textarea>
                  </div>

                  <div className="form-group">
                    <label>任职要求</label>
                    <textarea placeholder="请描述候选人应具备的技能和经验"></textarea>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => setShowPublishModal(false)}
                    >
                      取消
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => publishItem({}, 'job')}
                    >
                      立即发布
                    </button>
                  </div>
                </div>
              ) : (
                <div className="publish-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>姓名</label>
                      <input type="text" placeholder="请输入姓名" />
                    </div>
                    <div className="form-group">
                      <label>年龄</label>
                      <input type="number" placeholder="请输入年龄" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>学历</label>
                      <select>
                        {educationOptions.slice(1).map(edu => (
                          <option key={edu} value={edu}>{edu}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>专业</label>
                      <input type="text" placeholder="请输入专业" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>期望职位</label>
                    <input type="text" placeholder="请输入期望从事的职位" />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>工作经验</label>
                      <select>
                        {experienceOptions.map(exp => (
                          <option key={exp} value={exp}>{exp}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>期望薪资</label>
                      <select>
                        {salaryRanges.slice(1).map(salary => (
                          <option key={salary} value={salary}>{salary}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>个人技能</label>
                    <input type="text" placeholder="请输入个人技能，用逗号分隔" />
                  </div>

                  <div className="form-group">
                    <label>工作经历</label>
                    <textarea placeholder="请描述您的工作经历和主要成就"></textarea>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => setShowPublishModal(false)}
                    >
                      取消
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => publishItem({}, 'resume')}
                    >
                      立即发布
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs; 