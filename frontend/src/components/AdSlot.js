import React, { useState, useEffect } from 'react';
import { apiServices } from '../utils/apiClient';
import './AdSlot.css';

/**
 * AdSlot - 广告位组件
 * @param {string} position - 广告位置标识 (e.g. 'forum-sidebar', 'forum-top', 'home-banner', 'article-bottom')
 * @param {string} layout - 布局: 'horizontal' | 'vertical' (default: 'vertical')
 */
const AdSlot = ({ position, layout = 'vertical' }) => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    const loadAds = async () => {
      try {
        const response = await apiServices.ads.getByPosition(position);
        if (response.success) {
          setAds(response.data || []);
        }
      } catch (error) {
        // Silently fail - don't show errors for ads
      }
    };
    if (position) loadAds();
  }, [position]);

  const handleClick = async (ad) => {
    try {
      await apiServices.ads.click(ad.id);
    } catch (e) { /* ignore */ }
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (ads.length === 0) return null;

  return (
    <div className={`ad-slot ad-slot-${layout}`}>
      {ads.map(ad => (
        <div
          key={ad.id}
          className="ad-item"
          onClick={() => handleClick(ad)}
          title={ad.title}
        >
          {ad.image_url ? (
            <img src={ad.image_url} alt={ad.title} className="ad-image" />
          ) : (
            <div className="ad-text">
              <div className="ad-title">{ad.title}</div>
              {ad.description && <div className="ad-desc">{ad.description}</div>}
            </div>
          )}
          <span className="ad-label">广告</span>
        </div>
      ))}
    </div>
  );
};

export default AdSlot;
