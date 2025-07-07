import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

/**
 * 通用模态框组件
 * 解决重复的模态框结构问题
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium', // 'small', 'medium', 'large', 'xlarge'
  closable = true,
  closeOnOverlayClick = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  showCloseButton = true
}) => {
  // ESC键关闭模态框
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closable, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && closable) {
      onClose();
    }
  };

  const handleCloseClick = () => {
    if (closable) {
      onClose();
    }
  };

  const sizeClasses = {
    small: 'modal-small',
    medium: 'modal-medium', 
    large: 'modal-large',
    xlarge: 'modal-xlarge'
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content ${sizeClasses[size]} ${className}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className={`modal-header ${headerClassName}`}>
            <h2 className="modal-title">{title}</h2>
            {showCloseButton && closable && (
              <button className="modal-close-btn" onClick={handleCloseClick}>
                <X size={24} />
              </button>
            )}
          </div>
        )}
        
        <div className={`modal-body ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 