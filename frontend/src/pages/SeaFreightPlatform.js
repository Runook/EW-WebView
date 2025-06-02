import React from 'react';
import { Ship, Plus, Search, Filter } from 'lucide-react';
import './PlatformPage.css';

const SeaFreightPlatform = () => {
  return (
    <div className="platform-page">
      <div className="container">
        {/* Header */}
        <div className="platform-header">
          <div className="platform-icon">
            <Ship size={48} />
          </div>
          <h1 className="platform-title">海运信息平台</h1>
          <p className="platform-description">
            海运货代、船公司发布舱位信息，货主发布货源需求，实现海运物流信息匹配
          </p>
        </div>

        {/* Action Buttons */}
        <div className="platform-actions">
          <button className="btn btn-primary action-btn">
            <Plus size={20} />
            发布舱位信息
          </button>
          <button className="btn btn-secondary action-btn">
            <Plus size={20} />
            发布货源需求
          </button>
        </div>

        {/* Search and Filters */}
        <div className="platform-search">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索起始港、目的港或货物类型"
            />
          </div>
          <button className="btn btn-primary">
            <Filter size={16} />
            筛选
          </button>
        </div>

        {/* Coming Soon Message */}
        <div className="coming-soon">
          <h3>海运平台功能开发中</h3>
          <p>我们正在努力完善海运信息发布和匹配功能，敬请期待！</p>
        </div>
      </div>
    </div>
  );
};

export default SeaFreightPlatform; 