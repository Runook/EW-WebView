import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import './PlatformPage.css';

const ComingSoonPlatform = ({ icon, title, description, actionText1, actionText2, searchPlaceholder }) => {
  return (
    <div className="platform-page">
      <div className="container">
        <div className="platform-header">
          <div className="platform-icon">
            {icon}
          </div>
          <h1 className="platform-title">{title}</h1>
          <p className="platform-description">
            {description}
          </p>
        </div>

        <div className="platform-actions">
          <button className="btn btn-primary action-btn">
            <Plus size={20} />
            {actionText1}
          </button>
          <button className="btn btn-secondary action-btn">
            <Plus size={20} />
            {actionText2}
          </button>
        </div>

        <div className="platform-search">
          <div className="search-bar">
            <Search size={20} />
            <input type="text" placeholder={searchPlaceholder} />
          </div>
          <button className="btn btn-primary">
            <Filter size={16} />
            筛选
          </button>
        </div>

        <div className="coming-soon">
          <h3>{title}功能开发中</h3>
          <p>我们正在努力完善平台功能，敬请期待！</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPlatform; 