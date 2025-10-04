import React, { useState, useEffect, useRef } from 'react';
import './EditableCell.css';

/**
 * 可编辑单元格组件
 * 双击进入编辑模式
 */
const EditableCell = ({ 
  value, 
  orderId, 
  field, 
  type = 'text', // text, number, date, select
  options = [], // 用于select类型
  onSave,
  formatDisplay = (v) => v || '-'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(orderId, field, editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
      setEditValue(value); // 恢复原值
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    // 延迟一点，避免和点击事件冲突
    setTimeout(() => {
      if (isEditing && !saving) {
        handleSave();
      }
    }, 200);
  };

  if (isEditing) {
    return (
      <div className="editable-cell editing">
        {type === 'select' ? (
          <select
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="cell-input"
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef}
            type={type}
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="cell-input"
          />
        )}
        {saving && <span className="saving-indicator">💾</span>}
      </div>
    );
  }

  return (
    <div 
      className="editable-cell"
      onDoubleClick={handleDoubleClick}
      title="双击编辑"
    >
      {formatDisplay(value)}
    </div>
  );
};

export default EditableCell;

