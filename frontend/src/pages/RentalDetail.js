import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Eye, DollarSign, Phone, User, Building, Package,
  ChevronRight, ChevronLeft, Share2, Check, Heart, Bookmark, BookMarked,
  Tag, Settings, Image as ImageIcon, Camera
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { useSEO } from '../hooks/useSEO';
import { PATH_LOGISTICS_RENTAL } from '../constants/servicePaths';
import './RentalDetail.css';

export function generateRentalSlug(item) {
  if (!item) return '';
  const parts = [item.title, item.category, item.location].filter(Boolean);
  return parts.join('-').replace(/\s+/g, '-').replace(/[/\\?&#%]+/g, '').toLowerCase();
}

const SITE_URL = 'https://welogx.com';

const RentalDetail = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const isRental = type === 'rental';
  const endpoint = isRental ? '/rentals' : '/sales';

  const [item, setItem] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saved, setSaved] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('ew_saved_rentals') || '{}')[`${type}_${id}`]; } catch { return false; }
  });

  const fetchItem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.get(`${endpoint}/${id}`);
      if (result.success) {
        setItem(result.data);
        try {
          const related = await apiClient.get(endpoint, { category: result.data.category, limit: 4 });
          if (related.success) setRelatedItems((related.data || []).filter(r => r.id !== parseInt(id)).slice(0, 3));
        } catch {}
      } else {
        setError('信息不存在');
      }
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id, endpoint]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  const pageUrl = item ? `${SITE_URL}/${type}/${item.id}/${generateRentalSlug(item)}` : '';
  const typeName = isRental ? '出租' : '出售';

  useSEO({
    title: item ? `${item.title} - ${item.category} ${typeName} | ${item.location} - Welogx物流租售` : `${typeName}详情 - Welogx物流租售`,
    description: item ? `${item.title}，${typeName}价格${item.price}，${item.condition}，位于${item.location}。${(item.description || '').slice(0, 120)}` : '物流设备租售信息',
    keywords: item ? `${item.title},${item.category},${typeName},${item.location},物流设备,卡车${typeName},货运设备` : '物流租售',
    url: pageUrl,
    structuredData: item ? {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": item.title,
      "description": item.description,
      "category": item.category,
      "offers": {
        "@type": "Offer",
        "price": item.price,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "itemCondition": item.condition === '全新' ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"
      },
      "brand": item.brand || undefined,
      "url": pageUrl
    } : undefined
  });

  const toggleSave = () => {
    setSaved(prev => {
      const next = !prev;
      try {
        const all = JSON.parse(localStorage.getItem('ew_saved_rentals') || '{}');
        if (next) all[`${type}_${id}`] = true; else delete all[`${type}_${id}`];
        localStorage.setItem('ew_saved_rentals', JSON.stringify(all));
      } catch {}
      return next;
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: item.title, text: `${item.title} - ${item.price}`, url: pageUrl }); } catch {}
    } else {
      navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextImage = () => {
    if (item?.images?.length > 1) setCurrentImageIndex(prev => prev === item.images.length - 1 ? 0 : prev + 1);
  };
  const prevImage = () => {
    if (item?.images?.length > 1) setCurrentImageIndex(prev => prev === 0 ? item.images.length - 1 : prev - 1);
  };

  if (loading) {
    return <div className="rd-page"><div className="rd-loading"><div className="loading-spinner" /><p>加载中...</p></div></div>;
  }

  if (error || !item) {
    return (
      <div className="rd-page">
        <div className="rd-error">
          <Package size={48} />
          <h2>{error || '信息不存在'}</h2>
          <p>该信息可能已被删除或链接无效</p>
          <button onClick={() => navigate(PATH_LOGISTICS_RENTAL)}>返回物流租售</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rd-page">
      <nav className="rd-breadcrumb" aria-label="breadcrumb">
        <Link to={PATH_LOGISTICS_RENTAL}>物流租售</Link>
        <ChevronRight size={14} />
        <Link to={`${PATH_LOGISTICS_RENTAL}?tab=${type}`}>{typeName}</Link>
        <ChevronRight size={14} />
        {item.category && <><span>{item.category}</span><ChevronRight size={14} /></>}
        <span>{item.title}</span>
      </nav>

      <div className="rd-layout">
        <article className="rd-main">
          {/* Images */}
          {item.images && item.images.length > 0 ? (
            <div className="rd-gallery">
              <div className="rd-main-image">
                <img
                  src={item.images[currentImageIndex]}
                  alt={`${item.title} - 图片 ${currentImageIndex + 1}`}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'; }}
                />
                {item.images.length > 1 && (
                  <>
                    <button className="rd-img-nav prev" onClick={prevImage}><ChevronLeft size={24} /></button>
                    <button className="rd-img-nav next" onClick={nextImage}><ChevronRight size={24} /></button>
                    <div className="rd-img-counter">{currentImageIndex + 1} / {item.images.length}</div>
                  </>
                )}
              </div>
              {item.images.length > 1 && (
                <div className="rd-thumbnails">
                  {item.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`缩略图 ${idx + 1}`}
                      className={currentImageIndex === idx ? 'active' : ''}
                      onClick={() => setCurrentImageIndex(idx)}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=100&fit=crop'; }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rd-no-image"><ImageIcon size={48} /><span>暂无图片</span></div>
          )}

          {/* Title + Price */}
          <div className="rd-header">
            <h1>{item.title}</h1>
            <div className="rd-price"><DollarSign size={20} /> {item.price}</div>
          </div>

          {/* Tags */}
          <div className="rd-tags">
            <span className="rd-tag type"><Tag size={14} /> {typeName}</span>
            <span className="rd-tag category">{item.category}</span>
            {item.subCategory && <span className="rd-tag sub">{item.subCategory}</span>}
            <span className="rd-tag condition"><Settings size={14} /> {item.condition}</span>
            {item.brand && <span className="rd-tag brand">{item.brand}</span>}
            <span className="rd-tag location"><MapPin size={14} /> {item.location}</span>
          </div>

          <div className="rd-meta-bar">
            <span><Eye size={14} /> {item.views} 次查看</span>
            <span><Calendar size={14} /> 发布于 {item.posted || (item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : '-')}</span>
          </div>

          {/* Description */}
          <section className="rd-section">
            <h2>详细描述</h2>
            <div className="rd-description" style={{ whiteSpace: 'pre-wrap' }}>{item.description}</div>
          </section>

          {/* Specifications */}
          {item.specifications && Object.keys(item.specifications).length > 0 && (
            <section className="rd-section">
              <h2>技术参数</h2>
              <div className="rd-specs-grid">
                {Object.entries(item.specifications).map(([key, value]) => (
                  <div key={key} className="rd-spec-item">
                    <span className="rd-spec-label">{key}</span>
                    <span className="rd-spec-value">{Array.isArray(value) ? value.join(', ') : value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contact */}
          <section className="rd-section">
            <h2>联系信息</h2>
            <div className="rd-contact-grid">
              {item.contact?.name && <div className="rd-contact-item"><User size={18} /><div><div className="contact-label">联系人</div><div className="contact-value">{item.contact.name}</div></div></div>}
              {item.contact?.company && <div className="rd-contact-item"><Building size={18} /><div><div className="contact-label">公司</div><div className="contact-value">{item.contact.company}</div></div></div>}
              {item.contact?.phone && <div className="rd-contact-item"><Phone size={18} /><div><div className="contact-label">电话</div><a href={`tel:${item.contact.phone}`} className="contact-value">{item.contact.phone}</a></div></div>}
            </div>
          </section>

          {/* Actions */}
          <div className="rd-action-bar">
            {item.contact?.phone && (
              <a href={`tel:${item.contact.phone}`} className="rd-btn primary"><Phone size={16} /> 联系{isRental ? '出租方' : '卖家'}</a>
            )}
            <button className={`rd-btn ${saved ? 'saved' : 'secondary'}`} onClick={toggleSave}>
              {saved ? <BookMarked size={16} /> : <Bookmark size={16} />}
              {saved ? '已收藏' : '收藏'}
            </button>
            <button className="rd-btn secondary" onClick={handleShare}>
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? '已复制' : '分享'}
            </button>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="rd-sidebar">
          <div className="rd-sidebar-card">
            <h3>{typeName}概要</h3>
            <div className="rd-summary-list">
              <div className="rd-summary-item"><span className="summary-label">分类</span><span className="summary-value">{item.category}</span></div>
              {item.subCategory && <div className="rd-summary-item"><span className="summary-label">细分</span><span className="summary-value">{item.subCategory}</span></div>}
              <div className="rd-summary-item"><span className="summary-label">价格</span><span className="summary-value">{item.price}</span></div>
              <div className="rd-summary-item"><span className="summary-label">状态</span><span className="summary-value">{item.condition}</span></div>
              {item.brand && <div className="rd-summary-item"><span className="summary-label">品牌</span><span className="summary-value">{item.brand}</span></div>}
              <div className="rd-summary-item"><span className="summary-label">地点</span><span className="summary-value">{item.location}</span></div>
            </div>
          </div>

          {relatedItems.length > 0 && (
            <div className="rd-sidebar-card">
              <h3>相关{typeName}</h3>
              <div className="rd-related-list">
                {relatedItems.map(r => (
                  <Link key={r.id} to={`/${type}/${r.id}/${generateRentalSlug(r)}`} className="rd-related-item">
                    <div className="rd-related-thumb">
                      {r.images && r.images.length > 0 ? (
                        <img src={r.images[0]} alt={r.title} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=80&fit=crop'; }} />
                      ) : (
                        <div className="rd-related-no-img"><ImageIcon size={16} /></div>
                      )}
                    </div>
                    <div>
                      <div className="rd-related-title">{r.title}</div>
                      <div className="rd-related-meta">{r.price} &bull; {r.location}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default RentalDetail;
