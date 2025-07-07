import { useState, useCallback } from 'react';

/**
 * 通用表单处理Hook
 * 解决重复的表单输入处理逻辑
 */
export const useForm = (initialData = {}, validationRules = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 通用输入处理函数
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // 处理字段焦点事件
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // 失去焦点时验证单个字段
    if (validationRules[name]) {
      validateField(name, formData[name]);
    }
  }, [formData, validationRules]);

  // 验证单个字段
  const validateField = useCallback((fieldName, value) => {
    const rule = validationRules[fieldName];
    if (!rule) return true;

    let error = '';

    // 必填验证
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      error = rule.message || `${rule.label || fieldName}为必填项`;
    }

    // 最小长度验证
    if (!error && rule.minLength && value && value.length < rule.minLength) {
      error = `${rule.label || fieldName}至少需要${rule.minLength}个字符`;
    }

    // 最大长度验证
    if (!error && rule.maxLength && value && value.length > rule.maxLength) {
      error = `${rule.label || fieldName}不能超过${rule.maxLength}个字符`;
    }

    // 邮箱格式验证
    if (!error && rule.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = '请输入有效的邮箱地址';
      }
    }

    // 手机号格式验证
    if (!error && rule.type === 'phone' && value) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(value.replace(/\D/g, ''))) {
        error = '请输入正确的手机号码格式';
      }
    }

    // 自定义验证函数
    if (!error && rule.validator && typeof rule.validator === 'function') {
      const customError = rule.validator(value, formData);
      if (customError) {
        error = customError;
      }
    }

    // 更新错误状态
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return !error;
  }, [formData, validationRules]);

  // 验证整个表单
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const isFieldValid = validateField(fieldName, formData[fieldName]);
      if (!isFieldValid) {
        isValid = false;
      }
    });

    return isValid;
  }, [formData, validationRules, validateField]);

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialData]);

  // 设置表单数据
  const setFieldValue = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // 设置字段错误
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  // 批量设置表单数据
  const setFormValues = useCallback((newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }));
  }, []);

  // 获取字段属性（用于输入组件）
  const getFieldProps = useCallback((fieldName) => ({
    name: fieldName,
    value: formData[fieldName] || '',
    onChange: handleInputChange,
    onBlur: handleBlur,
    error: errors[fieldName],
    touched: touched[fieldName]
  }), [formData, errors, touched, handleInputChange, handleBlur]);

  return {
    // 表单数据
    formData,
    errors,
    touched,
    isSubmitting,
    
    // 处理函数
    handleInputChange,
    handleBlur,
    validateField,
    validateForm,
    resetForm,
    setFieldValue,
    setFieldError,
    setFormValues,
    setIsSubmitting,
    getFieldProps,
    
    // 状态检查
    isValid: Object.keys(errors).length === 0,
    isDirty: JSON.stringify(formData) !== JSON.stringify(initialData)
  };
};

/**
 * 表单验证规则生成器
 */
export const createValidationRules = (rules) => {
  const normalizedRules = {};
  
  Object.keys(rules).forEach(fieldName => {
    const rule = rules[fieldName];
    
    if (typeof rule === 'string') {
      // 简单的必填规则
      normalizedRules[fieldName] = { required: true, message: rule };
    } else if (typeof rule === 'object') {
      normalizedRules[fieldName] = rule;
    }
  });
  
  return normalizedRules;
};

/**
 * 常用验证规则
 */
export const commonValidations = {
  required: (label) => ({ required: true, label }),
  email: (label) => ({ required: true, type: 'email', label }),
  phone: (label) => ({ required: true, type: 'phone', label }),
  minLength: (min, label) => ({ required: true, minLength: min, label }),
  maxLength: (max, label) => ({ required: true, maxLength: max, label }),
  custom: (validator, label) => ({ required: true, validator, label })
};

export default useForm; 