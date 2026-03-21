import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Upload, X } from 'lucide-react';
import PremiumPostStep from '../components/PremiumPostStep';
import './LogisticsRental.css';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/common/Notification';
import { apiClient } from '../utils/apiClient';
import { PATH_LOGISTICS_RENTAL, PATH_LOGISTICS_RENTAL_ONLY, PATH_LOGISTICS_SALE_ONLY } from '../constants/servicePaths';

const rentalCategories = [
  '卡车', '叉车', '仓库/物流园区', '船舶/飞机', '车架/车身', '海柜干柜', '特殊设备',
  '第三方物流', '家庭仓/车库/停车场', '卡车车位', '仓库/海外仓'
];
const saleCategories = [
  '卡车出售', '叉车货架', '仓库/海外仓', '配件零件', '车架', '海柜干柜', '特殊设备',
  '公司MC DOT', '清库存', '生意买卖/转让', '地区分站加盟', '出FBA预约'
];
const locations = ['洛杉矶', '纽约', '旧金山', '芝加哥', '休斯顿', '凤凰城'];
const conditions = ['全新', '9成新', '8成新', '7成新', '6成新', '5成新', '4成新', '3成新', '2成新', '1成新'];

const LogisticsRentalPostPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') === 'sale' ? 'sale' : 'rental';
  const { success, error: showError } = useNotification();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');
  const [currentFormData, setCurrentFormData] = useState(null);
  const [postForm, setPostForm] = useState({ images: [], coverImageIndex: 0 });

  const location = useLocation();
  const listHref = useMemo(() => {
    if (location.pathname.includes('rental-equipment-leasing')) return PATH_LOGISTICS_RENTAL_ONLY;
    if (location.pathname.includes('sale-equipment-trading')) return PATH_LOGISTICS_SALE_ONLY;
    return `${PATH_LOGISTICS_RENTAL}?tab=${mode === 'rental' ? 'rental' : 'sale'}`;
  }, [mode, location.pathname]);

  const getCurrentCategories = () => (mode === 'rental' ? rentalCategories : saleCategories);
  const resetPostForm = () => setPostForm({ images: [], coverImageIndex: 0 });

  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          }, 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const compressedFile = await compressImage(file);
          const reader = new FileReader();
          reader.onload = (e) => {
            setPostForm(prev => ({
              ...prev,
              images: [...prev.images, { file: compressedFile, url: e.target.result, serverUrl: e.target.result, name: file.name, uploading: false, failed: false }]
            }));
          };
          reader.readAsDataURL(compressedFile);
        } catch (error) {
          showError(`图片 ${file.name} 处理失败: ${error.message}`);
        }
      }
    }
  };

  const removeImage = (index) => {
    setPostForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: newImages, coverImageIndex: prev.coverImageIndex >= newImages.length ? 0 : prev.coverImageIndex };
    });
  };

  const setCoverImage = (index) => setPostForm(prev => ({ ...prev, coverImageIndex: index }));

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { showError('请先登录再发布'); return; }
    const formData = new FormData(e.target);
    const postData = {
      title: formData.get('title'),
      category: formData.get('category'),
      location: formData.get('location'),
      price: formData.get('price'),
      condition: formData.get('condition'),
      description: formData.get('description'),
      contactPhone: formData.get('phone'),
      contactPerson: formData.get('contactName')
    };
    const subCategory = formData.get('subCategory');
    if (subCategory) postData.sub_category = subCategory;
    const brand = formData.get('brand');
    if (brand) postData.brand = brand;
    const company = formData.get('company');
    if (company) postData.company = company;

    if (postForm.images && postForm.images.length > 0) {
      if (postForm.images.some(img => img.uploading)) { showError('请等待图片处理完成...'); return; }
      postData.images = postForm.images.map(img => img.serverUrl || img.url);
    }
    setCurrentFormData(postData);
    setStep('premium');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const WELOGX_FOOTER = '\n\n联系我时请说在Welogx平台看到的，谢谢！';

  const handleConfirmPost = async ({ formData, premium }) => {
    try {
      setLoading(true);
      const postData = { ...(formData || currentFormData), premium };
      if (postData.description && !postData.description.includes('联系我时请说在Welogx平台看到的')) {
        postData.description = postData.description + WELOGX_FOOTER;
      }
      const endpoint = mode === 'rental' ? '/rentals' : '/sales';
      const result = await apiClient.post(endpoint, postData);
      if (result.success) {
        setCurrentFormData(null);
        resetPostForm();
        success(`${mode === 'rental' ? '租赁' : '出售'}信息发布成功！已扣除 ${result.creditsSpent} 积分`);
        navigate(listHref);
      } else throw new Error(result.message || '发布失败');
    } catch (error) {
      showError('发布失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'premium' && currentFormData) {
    return (
      <div className="lr-page lr-post-page">
        <div className="lr-post-page-header">
          <Link to={listHref} className="jobs-post-back"><ArrowLeft size={20} /> 返回列表</Link>
          <h1>{mode === 'rental' ? '发布出租信息' : '发布出售信息'}</h1>
        </div>
        <div className="lr-inline-card lr-post-page-card">
          <PremiumPostStep
            postType={mode === 'rental' ? 'rental' : 'sale'}
            formData={currentFormData}
            onConfirm={handleConfirmPost}
            onBack={() => setStep('form')}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="lr-page lr-post-page">
      <div className="lr-post-page-header">
        <Link to={listHref} className="jobs-post-back"><ArrowLeft size={20} /> 返回列表</Link>
        <h1>{mode === 'rental' ? '发布出租信息' : '发布出售信息'}</h1>
      </div>

      <div className="lr-inline-card lr-post-page-card">
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>照片上传</label>
              <div className="image-upload-area">
                <input type="file" id="lr-image-upload" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                <label htmlFor="lr-image-upload" className="upload-button"><Upload size={20} /> 点击上传照片</label>
                <p className="upload-hint">支持多张照片，建议尺寸800x600，格式JPG/PNG</p>
              </div>
              {postForm.images.length > 0 && (
                <div className="image-preview-area">
                  <div className="image-grid">
                    {postForm.images.map((image, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={image.url} alt={`预览 ${index + 1}`} />
                        <div className="image-actions">
                          <button type="button" className={`cover-button ${postForm.coverImageIndex === index ? 'active' : ''}`} onClick={() => setCoverImage(index)}>
                            {postForm.coverImageIndex === index ? '封面' : '设为封面'}
                          </button>
                          <button type="button" className="remove-button" onClick={() => removeImage(index)}><X size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group"><label>标题 *</label><input type="text" name="title" required placeholder="如：重型冷藏车出租" /></div>
            <div className="form-group"><label>分类 *</label>
              <select name="category" required><option value="">请选择分类</option>{getCurrentCategories().map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div className="form-group"><label>子分类</label><input type="text" name="subCategory" placeholder="如：重型卡车、中型卡车等" /></div>
            <div className="form-row">
              <div className="form-group"><label>地点 *</label>
                <select name="location" required><option value="">请选择地点</option>{locations.map(l => <option key={l} value={l}>{l}</option>)}</select>
              </div>
              <div className="form-group"><label>{mode === 'rental' ? '租金' : '价格'} *</label>
                <input type="text" name="price" required placeholder={mode === 'rental' ? '如：$2500/月' : '如：$85000'} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>设备状态 *</label>
                <select name="condition" required><option value="">请选择</option>{conditions.slice(1).map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div className="form-group"><label>品牌</label><input type="text" name="brand" placeholder="如：沃尔沃" /></div>
            </div>
            <div className="form-group">
              <label>详细描述 *</label>
              <textarea name="description" required placeholder="详细描述设备信息、技术参数、使用条件等..." />
              <div className="welogx-footer-hint">发布后将自动附加：联系我时请说在Welogx平台看到的，谢谢！</div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>联系人 *</label><input type="text" name="contactName" required placeholder="如：张经理" /></div>
              <div className="form-group"><label>公司名称</label><input type="text" name="company" placeholder="如：冷链物流公司" /></div>
            </div>
            <div className="form-group"><label>联系电话 *</label><input type="tel" name="phone" required placeholder="如：(123) 456-7890" /></div>
          </div>
          <div className="form-actions">
            <Link to={listHref} className="cancel-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>取消</Link>
            <button type="submit" className="submit-button" disabled={loading}><Send size={16} /> 下一步（积分与置顶）</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogisticsRentalPostPage;
