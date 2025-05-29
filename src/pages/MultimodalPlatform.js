import React from 'react';
import { Navigation, Plus, Search, Filter } from 'lucide-react';
import './PlatformPage.css';

const MultimodalPlatform = () => {
  return (
    <div className="platform-page">
      <div className="container">
        <div className="platform-header">
          <div className="platform-icon">
            <Navigation size={48} />
          </div>
          <h1 className="platform-title">多式联运平台</h1>
          <p className="platform-description">
            整合海陆空物流资源，提供多式联运解决方案信息发布和查询服务
          </p>
        </div>

        <div className="platform-actions">
          <button className="btn btn-primary action-btn">
            <Plus size={20} />
            发布联运方案
          </button>
          <button className="btn btn-secondary action-btn">
            <Plus size={20} />
            发布联运需求
          </button>
        </div>

        <div className="platform-search">
          <div className="search-bar">
            <Search size={20} />
            <input type="text" placeholder="搜索起点、终点或联运方案" />
          </div>
          <button className="btn btn-primary">
            <Filter size={16} />
            筛选
          </button>
        </div>

        <div className="coming-soon">
          <h3>多式联运平台功能开发中</h3>
          <p>我们正在努力完善多式联运信息发布和匹配功能，敬请期待！</p>
        </div>
      </div>
    </div>
  );
};

export default MultimodalPlatform; 