import React, { useEffect, useRef } from 'react';
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
  showCloseButton = true,
  // 若为 true，点外面 / 按 ESC 关闭前会弹 confirm，避免误关丢失未保存内容。
  // 点右上角 X 或取消按钮触发的 onClose 不走 guard（视为明确用户意图）。
  isDirty = false,
  dirtyConfirmMessage = '有未保存的改动，确定关闭吗？'
}) => {
  // 兜住最新的 onClose / isDirty 引用，供 ESC handler 使用
  const guardRef = useRef({ onClose, isDirty, dirtyConfirmMessage });
  useEffect(() => {
    guardRef.current = { onClose, isDirty, dirtyConfirmMessage };
  }, [onClose, isDirty, dirtyConfirmMessage]);

  const guardedClose = () => {
    const { onClose: close, isDirty: dirty, dirtyConfirmMessage: msg } = guardRef.current;
    if (dirty && !window.confirm(msg)) return;
    close();
  };

  // ESC键关闭模态框（带 dirty 守卫）
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closable) {
        guardedClose();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- guardedClose reads latest from ref
  }, [isOpen, closable]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && closable) {
      guardedClose();
    }
  };

  // 顶部的 X 按钮和取消按钮表示用户明确想关，不走 dirty guard
  const handleCloseClick = () => {
    if (closable) {
      onClose();
    }
  };

  const sizeClasses = {
    small: 'modal-small',
    medium: 'modal-medium', 
    large: 'modal-large',
    xlarge: 'modal-xlarge',
    'extra-large': 'modal-extra-large'
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