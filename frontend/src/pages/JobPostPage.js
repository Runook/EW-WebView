import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PremiumPostStep from '../components/PremiumPostStep';
import { useNotification } from '../components/common/Notification';
import { useLoading } from '../hooks';
import { apiClient } from '../utils/apiClient';
import { apiLogger } from '../utils/logger';
import { PATH_JOBS } from '../constants/servicePaths';
import { JOB_CATEGORIES, LOCATIONS, WORK_TYPES, EXPERIENCE_OPTIONS } from './jobsConstants';
import './Jobs.css';

const JobPostPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kind = searchParams.get('kind') === 'resume' ? 'resume' : 'job';
  const { success, error: showError } = useNotification();
  const { withLoading } = useLoading(false);
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState('form'); // 'form' | 'premium'
  const [currentFormData, setCurrentFormData] = useState(null);

  const listHref = useMemo(
    () => `${PATH_JOBS}?view=${kind === 'job' ? 'jobs' : 'resumes'}`,
    [kind]
  );

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { showError('请先登录再发布'); return; }
    const fd = new FormData(e.target);
    const obj = {};
    for (let [key, value] of fd.entries()) obj[key] = value;
    setCurrentFormData(obj);
    setStep('premium');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const WELOGX_FOOTER = '\n\n联系我时请说在Welogx平台看到的，谢谢！';

  const handleConfirmPost = async ({ formData, premium }) => {
    await withLoading(async () => {
      try {
        const descKey = kind === 'job' ? 'description' : 'summary';
        const postData = { ...formData, premium };
        if (postData[descKey] && !postData[descKey].includes('联系我时请说在Welogx平台看到的')) {
          postData[descKey] = postData[descKey] + WELOGX_FOOTER;
        }
        const endpoint = kind === 'job' ? '/jobs' : '/resumes';
        const result = await apiClient.post(endpoint, postData);
        if (result.success) {
          setCurrentFormData(null);
          success(`${kind === 'job' ? '职位' : '简历'}发布成功！已扣除 ${result.creditsSpent} 积分`);
          navigate(listHref);
        } else throw new Error(result.message || '发布失败');
      } catch (error) {
        apiLogger.error('发布失败', error);
        showError('发布失败: ' + error.message);
      }
    });
  };

  if (step === 'premium' && currentFormData) {
    return (
      <div className="jobs-page job-post-page">
        <div className="jobs-post-page-header">
          <Link to={listHref} className="jobs-post-back"><ArrowLeft size={20} /> 返回列表</Link>
          <h1>{kind === 'job' ? '发布招聘职位' : '发布求职简历'}</h1>
        </div>
        <div className="jobs-post-page-card">
          <PremiumPostStep
            postType={kind === 'job' ? 'job' : 'resume'}
            formData={currentFormData}
            onConfirm={handleConfirmPost}
            onBack={() => setStep('form')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-page job-post-page">
      <div className="jobs-post-page-header">
        <Link to={listHref} className="jobs-post-back"><ArrowLeft size={20} /> 返回列表</Link>
        <h1>{kind === 'job' ? '发布招聘职位' : '发布求职简历'}</h1>
      </div>

      <div className="jobs-post-page-card">
        <form className="edit-form" onSubmit={handleFormSubmit}>
          {kind === 'job' ? (
            <>
              <div className="form-group"><label>职位名称 *</label><input name="title" required placeholder="如：CLASS A 司机" defaultValue={currentFormData?.title || ''} /></div>
              <div className="form-group"><label>职位分类 *</label>
                <select name="category" required defaultValue={currentFormData?.category || ''}><option value="">请选择</option>{JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div className="form-group"><label>公司名称</label><input name="company" placeholder="公司名称（选填）" defaultValue={currentFormData?.company || ''} /></div>
              <div className="form-row">
                <div className="form-group"><label>工作州 *</label>
                  <select name="location" required defaultValue={currentFormData?.location || ''}><option value="">请选择州</option>{LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}</select>
                </div>
                <div className="form-group"><label>薪资待遇 *</label><input name="salary" required placeholder="如：$4000-6000/月" defaultValue={currentFormData?.salary || ''} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>工作类型 *</label>
                  <select name="workType" required defaultValue={currentFormData?.workType || ''}><option value="">请选择</option>{WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}</select>
                </div>
                <div className="form-group"><label>经验要求 *</label>
                  <select name="experience" required defaultValue={currentFormData?.experience || ''}><option value="">请选择</option>{EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                </div>
              </div>
              <div className="form-group">
                <label>职位描述 *</label>
                <textarea name="description" required rows={5} placeholder="详细描述职位要求、工作内容、福利待遇等..." defaultValue={currentFormData?.description || ''} />
                <div className="welogx-footer-hint">发布后将自动附加：联系我时请说在Welogx平台看到的，谢谢！</div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>联系人</label><input name="contactPerson" placeholder="如：张经理" defaultValue={currentFormData?.contactPerson || ''} /></div>
                <div className="form-group"><label>联系电话 *</label><input name="contactPhone" required placeholder="如：(323) 888-1001" defaultValue={currentFormData?.contactPhone || ''} /></div>
              </div>
              <div className="form-group"><label>联系邮箱 *</label><input name="contactEmail" required type="text" placeholder="如：hr@company.com" defaultValue={currentFormData?.contactEmail || ''} /></div>
            </>
          ) : (
            <>
              <div className="form-group"><label>姓名 *</label><input name="name" required placeholder="如：张三" defaultValue={currentFormData?.name || ''} /></div>
              <div className="form-group"><label>求职岗位 *</label><input name="position" required placeholder="如：CLASS A 司机" defaultValue={currentFormData?.position || ''} /></div>
              <div className="form-row">
                <div className="form-group"><label>工作经验 *</label>
                  <select name="experience" required defaultValue={currentFormData?.experience || ''}><option value="">请选择</option>{EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                </div>
                <div className="form-group"><label>期望州 *</label>
                  <select name="location" required defaultValue={currentFormData?.location || ''}><option value="">请选择州</option>{LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}</select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>联系电话 *</label><input name="phone" required placeholder="(123) 456-7890" defaultValue={currentFormData?.phone || ''} /></div>
                <div className="form-group"><label>邮箱 *</label><input name="email" required type="text" placeholder="zhangsan@email.com" defaultValue={currentFormData?.email || ''} /></div>
              </div>
              <div className="form-group"><label>技能专长 *</label><input name="skills" required placeholder="用逗号分隔，如：CDL-A驾照, 长途运输" defaultValue={currentFormData?.skills || ''} /></div>
              <div className="form-row">
                <div className="form-group"><label>期望薪资</label><input name="expectedSalary" placeholder="如：$4000-5000/月" defaultValue={currentFormData?.expectedSalary || ''} /></div>
                <div className="form-group"><label>工作类型偏好</label>
                  <select name="workTypePreference" defaultValue={currentFormData?.workTypePreference || ''}><option value="">不限</option>{WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}</select>
                </div>
              </div>
              <div className="form-group">
                <label>个人简介</label>
                <textarea name="summary" rows={4} placeholder="简要介绍您的工作经验、技能优势等..." defaultValue={currentFormData?.summary || ''} />
                <div className="welogx-footer-hint">发布后将自动附加：联系我时请说在Welogx平台看到的，谢谢！</div>
              </div>
            </>
          )}
          <div className="edit-form-actions">
            <Link to={listHref} className="btn-cancel" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <X size={16} style={{ marginRight: 4 }} /> 取消
            </Link>
            <button type="submit" className="btn-save"><Send size={16} /> 下一步（积分与置顶）</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostPage;
