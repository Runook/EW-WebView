import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PremiumPostModal from '../components/PremiumPostModal';
import { useNotification } from '../components/common/Notification';
import { useModal, useLoading } from '../hooks';
import { apiClient } from '../utils/apiClient';
import { apiLogger } from '../utils/logger';
import { PATH_JOBS } from '../constants/servicePaths';
import { JOB_CATEGORIES, LOCATIONS, WORK_TYPES, EXPERIENCE_OPTIONS } from './jobsConstants';
import './Jobs.css';

const JobPostPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kind = searchParams.get('kind') === 'resume' ? 'resume' : 'job';
  const premiumModal = useModal();
  const { success, error: showError } = useNotification();
  const { withLoading } = useLoading(false);
  const { isAuthenticated } = useAuth();
  const [currentFormData, setCurrentFormData] = useState(null);

  const listHref = useMemo(
    () => `${PATH_JOBS}?view=${kind === 'job' ? 'jobs' : 'resumes'}`,
    [kind]
  );

  const handlePost = (formData) => {
    if (!isAuthenticated) {
      showError('请先登录再发布');
      return;
    }
    const formDataObj = {};
    for (let [key, value] of formData.entries()) formDataObj[key] = value;
    setCurrentFormData(formDataObj);
    premiumModal.open();
  };

  const handleConfirmPost = async ({ formData, premium }) => {
    await withLoading(async () => {
      try {
        const postData = { ...formData, premium };
        const endpoint = kind === 'job' ? '/jobs' : '/resumes';
        const result = await apiClient.post(endpoint, postData);
        if (result.success) {
          premiumModal.close();
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

  return (
    <div className="jobs-page job-post-page">
      <div className="jobs-post-page-header">
        <Link to={listHref} className="jobs-post-back">
          <ArrowLeft size={20} /> 返回列表
        </Link>
        <h1>{kind === 'job' ? '发布招聘职位' : '发布求职简历'}</h1>
      </div>

      <div className="jobs-post-page-card">
        <form
          className="edit-form"
          onSubmit={(e) => {
            e.preventDefault();
            handlePost(new FormData(e.target));
          }}
        >
          {kind === 'job' ? (
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
              <div className="form-group"><label>联系邮箱 *</label><input name="contactEmail" required type="text" placeholder="如：hr@company.com" /></div>
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
                <div className="form-group"><label>邮箱 *</label><input name="email" required type="text" placeholder="zhangsan@email.com" /></div>
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
            <Link to={listHref} className="btn-cancel" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <X size={16} style={{ marginRight: 4 }} /> 取消
            </Link>
            <button type="submit" className="btn-save"><Send size={16} /> 下一步（积分与置顶）</button>
          </div>
        </form>
      </div>

      <PremiumPostModal
        isOpen={premiumModal.isOpen}
        onClose={() => { premiumModal.close(); setCurrentFormData(null); }}
        onConfirm={handleConfirmPost}
        postType={kind === 'job' ? 'job' : 'resume'}
        formData={currentFormData}
      />
    </div>
  );
};

export default JobPostPage;
