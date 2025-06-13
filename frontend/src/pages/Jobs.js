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
  Send
} from 'lucide-react';
import './Jobs.css';

const Jobs = () => {
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' 或 'resumes'
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);

  // 模拟招聘数据
  const mockJobs = [
    {
      id: 1,
      title: '物流司机',
      company: '顺丰速运',
      location: '洛杉矶',
      salary: '$4000-6000/月',
      type: '全职',
      experience: '1-3年',
      posted: '2天前',
      description: '负责货物运输，要求有CDL驾照，工作稳定，福利待遇好'
    },
    {
      id: 2,
      title: '仓库管理员',
      company: '亚马逊物流',
      location: '纽约',
      salary: '$3500-5000/月',
      type: '全职',
      experience: '经验不限',
      posted: '1天前',
      description: '负责仓库日常管理，货物入库出库，熟悉仓储系统优先'
    },
    {
      id: 3,
      title: '客服专员',
      company: '联邦快递',
      location: '旧金山',
      salary: '$3000-4500/月',
      type: '全职',
      experience: '1年以上',
      posted: '3天前',
      description: '处理客户咨询，协调物流问题，中英文流利'
    }
  ];

  // 模拟简历数据
  const mockResumes = [
    {
      id: 1,
      name: '张三',
      position: '物流司机',
      experience: '5年经验',
      location: '洛杉矶',
      phone: '(123) 456-7890',
      email: 'zhangsan@email.com',
      posted: '1天前',
      skills: ['CDL驾照', '长途运输', '货物装卸']
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
      skills: ['仓储管理', 'WMS系统', '团队管理']
    }
  ];

  useEffect(() => {
    setJobs(mockJobs);
    setResumes(mockResumes);
  }, []);

  // 过滤数据
  const filteredJobs = jobs.filter(job => {
    return job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           job.company.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredResumes = resumes.filter(resume => {
    return resume.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           resume.position.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 发布职位/简历
  const handlePost = (formData) => {
    if (activeTab === 'jobs') {
      const newJob = {
        id: jobs.length + 1,
        title: formData.get('title'),
        company: formData.get('company'),
        location: formData.get('location'),
        salary: formData.get('salary'),
        type: formData.get('type'),
        experience: formData.get('experience'),
        description: formData.get('description'),
        posted: '刚刚'
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
        posted: '刚刚'
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
        <button 
          className="post-button"
          onClick={() => setShowPostModal(true)}
        >
          <Plus size={20} />
          {activeTab === 'jobs' ? '发布职位' : '发布简历'}
        </button>
      </div>

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
                      <input type="text" name="title" required placeholder="如：物流司机" />
                    </div>
                    <div className="form-group">
                      <label>公司名称 *</label>
                      <input type="text" name="company" required placeholder="如：顺丰速运" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>工作地点 *</label>
                        <input type="text" name="location" required placeholder="如：洛杉矶" />
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
                          <option value="全职">全职</option>
                          <option value="兼职">兼职</option>
                          <option value="合同工">合同工</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>经验要求 *</label>
                        <select name="experience" required>
                          <option value="">请选择</option>
                          <option value="经验不限">经验不限</option>
                          <option value="1年以上">1年以上</option>
                          <option value="1-3年">1-3年</option>
                          <option value="3-5年">3-5年</option>
                          <option value="5年以上">5年以上</option>
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
                      <input type="text" name="position" required placeholder="如：物流司机" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>工作经验 *</label>
                        <select name="experience" required>
                          <option value="">请选择</option>
                          <option value="应届毕业生">应届毕业生</option>
                          <option value="1年经验">1年经验</option>
                          <option value="2-3年经验">2-3年经验</option>
                          <option value="3-5年经验">3-5年经验</option>
                          <option value="5年以上经验">5年以上经验</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>期望地点 *</label>
                        <input type="text" name="location" required placeholder="如：洛杉矶" />
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
                      <input type="text" name="skills" required placeholder="请用逗号分隔，如：CDL驾照, 长途运输, 货物装卸" />
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