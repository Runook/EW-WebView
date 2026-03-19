import React from 'react';
import './DATAttribution.css';

/**
 * DATAttribution — "Powered by DAT" badge.
 *
 * DAT certification requires that all data and search results sourced from
 * the DAT load board are clearly attributed.
 *
 * @param {'badge' | 'inline' | 'banner'} variant
 * @param {string} className - additional CSS class
 */
const DATAttribution = ({ variant = 'badge', className = '' }) => {
  const cls = `dat-attribution dat-attribution--${variant} ${className}`.trim();

  if (variant === 'banner') {
    return (
      <div className={cls}>
        <span className="dat-attribution__icon">DAT</span>
        <span className="dat-attribution__text">
          Search results provided by the DAT Load Board
        </span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={cls}>
        <span className="dat-attribution__icon">DAT</span>
      </span>
    );
  }

  // default: badge
  return (
    <span className={cls}>
      <span className="dat-attribution__icon">DAT</span>
      <span className="dat-attribution__text">Powered by DAT</span>
    </span>
  );
};

export default DATAttribution;
