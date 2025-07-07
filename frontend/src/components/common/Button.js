import React from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

/**
 * 通用按钮组件
 * 解决重复的按钮样式问题
 */
const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost', 'danger'
  size = 'medium', // 'small', 'medium', 'large'
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left', // 'left', 'right'
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger'
  };
  
  const sizeClasses = {
    small: 'btn-small',
    medium: 'btn-medium',
    large: 'btn-large'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    disabled ? 'btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const renderIcon = (position) => {
    if (loading && position === 'left') {
      return <Loader2 size={16} className="btn-icon btn-spinner" />;
    }
    
    if (icon && iconPosition === position) {
      return React.cloneElement(icon, { 
        className: `btn-icon ${icon.props.className || ''}` 
      });
    }
    
    return null;
  };

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {renderIcon('left')}
      <span className="btn-text">{children}</span>
      {renderIcon('right')}
    </button>
  );
};

// 预定义的按钮变体组件
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;

// 特定用途的按钮组件
export const SubmitButton = (props) => <Button type="submit" variant="primary" {...props} />;
export const CancelButton = (props) => <Button variant="secondary" {...props} />;
export const DeleteButton = (props) => <Button variant="danger" {...props} />;
export const LoadingButton = ({ loading, children, ...props }) => (
  <Button loading={loading} disabled={loading} {...props}>
    {loading ? '处理中...' : children}
  </Button>
);

// 带图标的按钮组件
export const IconButton = ({ icon, children, ...props }) => (
  <Button icon={icon} {...props}>
    {children}
  </Button>
);

export const IconOnlyButton = ({ icon, title, ...props }) => (
  <Button icon={icon} variant="ghost" className="btn-icon-only" title={title} {...props} />
);

// 组合按钮组件
export const ConfirmButton = ({ onConfirm, confirmText = '确认', ...props }) => (
  <Button onClick={() => window.confirm(confirmText) && onConfirm?.()} {...props} />
);

export default Button; 