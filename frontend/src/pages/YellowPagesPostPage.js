import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PremiumPostModal from '../components/PremiumPostModal';
import { apiClient, getAuthToken } from '../utils/apiClient';
import { apiLogger } from '../utils/logger';
import { useNotification } from '../components/common/Notification';
import { useModal } from '../hooks';
import { PATH_YELLOW_PAGES } from '../constants/servicePaths';
import { YP_CATEGORIES_SUBS, resolveCategoryForSubcategory } from './yellowPagesData';
import './YellowPages.css';

const YellowPagesPostPage = () => {
  const [searchParams] = useSearchParams();
  const defaultSub = searchParams.get('subcategory') || '';
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const premiumModal = useModal();
  const [currentFormData, setCurrentFormData] = useState(null);

  const handleFormSubmit = (companyData) => {
    const token = getAuthToken();
    if (!token) {
      showError('请先登录');
      return;
    }
    setCurrentFormData(companyData);
    premiumModal.open();
  };

  const handleConfirmPublish = async ({ formData, premium }) => {
    try {
      const postData = { ...formData, premium };
      const result = await apiClient.post('/companies', postData);
      if (result.success) {
        success(`企业信息发布成功！已扣除 ${result.creditsSpent} 积分`);
        premiumModal.close();
        setCurrentFormData(null);
        navigate(PATH_YELLOW_PAGES);
      } else {
        throw new Error(result.message || '发布失败');
      }
    } catch (error) {
      apiLogger.error('发布公司信息失败', error);
      showError('发布失败: ' + error.message);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const companyData = {
      name: formData.get('name'),
      description: formData.get('description'),
      subcategory: formData.get('subcategory'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      website: formData.get('website') || ''
    };
    companyData.category = resolveCategoryForSubcategory(companyData.subcategory);
    handleFormSubmit(companyData);
  };

  return (
    <div className="yellow-pages yp-post-page">
      <div className="yp-post-page-header">
        <Link to={PATH_YELLOW_PAGES} className="jobs-post-back">
          <ArrowLeft size={20} /> 返回黄页
        </Link>
        <h1>发布企业信息</h1>
      </div>

      <div className="yp-inline-card yp-post-page-card">
        <div className="yp-modal-body">
          <form className="yp-form" onSubmit={onSubmit}>
            <div className="yp-field">
              <label>企业名称 *</label>
              <input type="text" name="name" placeholder="请输入企业全称" required />
            </div>
            <div className="yp-field">
              <label>服务分类 *</label>
              <select name="subcategory" required defaultValue={defaultSub}>
                <option value="">请选择服务分类</option>
                {Object.entries(YP_CATEGORIES_SUBS).map(([catName, subs]) => (
                  <optgroup key={catName} label={catName}>
                    {subs.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="yp-field">
              <label>企业简介 *</label>
              <textarea name="description" placeholder="请简要介绍您的企业主营业务和优势" rows="4" required />
            </div>
            <div className="yp-field-row">
              <div className="yp-field">
                <label>联系电话 *</label>
                <input type="tel" name="phone" placeholder="请输入联系电话" required />
              </div>
              <div className="yp-field">
                <label>邮箱地址 *</label>
                <input type="text" name="email" placeholder="请输入企业邮箱" required />
              </div>
            </div>
            <div className="yp-field">
              <label>企业地址 *</label>
              <input type="text" name="address" placeholder="请输入详细地址" required />
            </div>
            <div className="yp-field">
              <label>企业网站</label>
              <input type="url" name="website" placeholder="https://（可选）" />
            </div>
            <div className="yp-form-actions">
              <Link to={PATH_YELLOW_PAGES} className="yp-btn-cancel" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>取消</Link>
              <button type="submit" className="yp-btn-submit">下一步（积分与置顶）</button>
            </div>
          </form>
        </div>
      </div>

      <PremiumPostModal
        isOpen={premiumModal.isOpen}
        onClose={() => { premiumModal.close(); setCurrentFormData(null); }}
        onConfirm={handleConfirmPublish}
        postType="company"
        formData={currentFormData}
      />
    </div>
  );
};

export default YellowPagesPostPage;
