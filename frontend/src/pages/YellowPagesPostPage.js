import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PremiumPostStep from '../components/PremiumPostStep';
import { apiClient, getAuthToken } from '../utils/apiClient';
import { apiLogger } from '../utils/logger';
import { useNotification } from '../components/common/Notification';
import { PATH_YELLOW_PAGES } from '../constants/servicePaths';
import { YP_CATEGORIES_SUBS, resolveCategoryForSubcategory } from './yellowPagesData';
import './YellowPages.css';

const YellowPagesPostPage = () => {
  const [searchParams] = useSearchParams();
  const defaultSub = searchParams.get('subcategory') || '';
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [step, setStep] = useState('form');
  const [currentFormData, setCurrentFormData] = useState(null);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) { showError('请先登录'); return; }
    const fd = new FormData(e.target);
    const companyData = {
      name: fd.get('name'),
      description: fd.get('description'),
      subcategory: fd.get('subcategory'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      address: fd.get('address'),
      website: fd.get('website') || ''
    };
    companyData.category = resolveCategoryForSubcategory(companyData.subcategory);
    setCurrentFormData(companyData);
    setStep('premium');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmPublish = async ({ formData, premium }) => {
    try {
      const postData = { ...formData, premium };
      const result = await apiClient.post('/companies', postData);
      if (result.success) {
        success(`企业信息发布成功！已扣除 ${result.creditsSpent} 积分`);
        setCurrentFormData(null);
        navigate(PATH_YELLOW_PAGES);
      } else throw new Error(result.message || '发布失败');
    } catch (error) {
      apiLogger.error('发布公司信息失败', error);
      showError('发布失败: ' + error.message);
    }
  };

  if (step === 'premium' && currentFormData) {
    return (
      <div className="yellow-pages yp-post-page">
        <div className="yp-post-page-header">
          <Link to={PATH_YELLOW_PAGES} className="jobs-post-back"><ArrowLeft size={20} /> 返回黄页</Link>
          <h1>发布企业信息</h1>
        </div>
        <div className="yp-inline-card yp-post-page-card">
          <PremiumPostStep
            postType="company"
            formData={currentFormData}
            onConfirm={handleConfirmPublish}
            onBack={() => setStep('form')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="yellow-pages yp-post-page">
      <div className="yp-post-page-header">
        <Link to={PATH_YELLOW_PAGES} className="jobs-post-back"><ArrowLeft size={20} /> 返回黄页</Link>
        <h1>发布企业信息</h1>
      </div>

      <div className="yp-inline-card yp-post-page-card">
        <div className="yp-modal-body">
          <form className="yp-form" onSubmit={handleFormSubmit}>
            <div className="yp-field">
              <label>企业名称 *</label>
              <input type="text" name="name" placeholder="请输入企业全称" required defaultValue={currentFormData?.name || ''} />
            </div>
            <div className="yp-field">
              <label>服务分类 *</label>
              <select name="subcategory" required defaultValue={currentFormData?.subcategory || defaultSub}>
                <option value="">请选择服务分类</option>
                {Object.entries(YP_CATEGORIES_SUBS).map(([catName, subs]) => (
                  <optgroup key={catName} label={catName}>
                    {subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="yp-field">
              <label>企业简介 *</label>
              <textarea name="description" placeholder="请简要介绍您的企业主营业务和优势" rows="4" required defaultValue={currentFormData?.description || ''} />
            </div>
            <div className="yp-field-row">
              <div className="yp-field">
                <label>联系电话 *</label>
                <input type="tel" name="phone" placeholder="请输入联系电话" required defaultValue={currentFormData?.phone || ''} />
              </div>
              <div className="yp-field">
                <label>邮箱地址 *</label>
                <input type="text" name="email" placeholder="请输入企业邮箱" required defaultValue={currentFormData?.email || ''} />
              </div>
            </div>
            <div className="yp-field">
              <label>企业地址 *</label>
              <input type="text" name="address" placeholder="请输入详细地址" required defaultValue={currentFormData?.address || ''} />
            </div>
            <div className="yp-field">
              <label>企业网站</label>
              <input type="url" name="website" placeholder="https://（可选）" defaultValue={currentFormData?.website || ''} />
            </div>
            <div className="yp-form-actions">
              <Link to={PATH_YELLOW_PAGES} className="yp-btn-cancel" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>取消</Link>
              <button type="submit" className="yp-btn-submit">下一步（积分与置顶）</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default YellowPagesPostPage;
