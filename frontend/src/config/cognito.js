// Cognito托管UI配置
export const COGNITO_CONFIG = {
  // 用户池配置
  userPoolId: 'us-east-1_HU9W7uLQA',
  clientId: '5mae63uesfb6dia5l06ju4j5m0',
  region: 'us-east-1',
  
  // Cognito托管UI域名
  // 在AWS Console中查找：
  // Cognito → User pools → 您的用户池 → App integration → Domain
  // 域名格式通常为：your-domain-prefix 或 your-custom-domain.com
  domain: 'us-east-1hu9w7ulqa', // 只需要域名前缀，不要包含完整URL
  
  // 回调URL配置
  // 注意：这里必须与AWS Cognito中配置的URL完全匹配
  // 用户完成注册后会被重定向到这里
  redirectSignIn: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://welogx.com',
  redirectSignOut: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://welogx.com',
  
  // OAuth配置
  responseType: 'code',
  scope: ['email', 'openid', 'phone']  // 移除profile以匹配AWS配置
};

// 生成Cognito托管UI URL的辅助函数
export const getCognitoUrls = () => {
  const { domain, region, clientId, redirectSignIn, responseType, scope } = COGNITO_CONFIG;
  
  if (domain === 'YOUR-COGNITO-DOMAIN') {
    console.error('请在config/cognito.js中配置您的Cognito域名！');
    return {
      signUp: '/register-error',
      signIn: '/login-error'
    };
  }
  
  const baseUrl = `https://${domain}.auth.${region}.amazoncognito.com`;
  const scopeString = scope.join('+');
  const encodedRedirectUri = encodeURIComponent(redirectSignIn);
  
  return {
    signUp: `${baseUrl}/signup?client_id=${clientId}&response_type=${responseType}&scope=${scopeString}&redirect_uri=${encodedRedirectUri}`,
    signIn: `${baseUrl}/login?client_id=${clientId}&response_type=${responseType}&scope=${scopeString}&redirect_uri=${encodedRedirectUri}`,
    signOut: `${baseUrl}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(COGNITO_CONFIG.redirectSignOut)}`
  };
};

/**
 * 如何找到您的Cognito域名：
 * 
 * 1. 登录AWS Console
 * 2. 进入Cognito服务
 * 3. 选择您的User Pool (us-east-1_HU9W7uLQA)
 * 4. 点击左侧菜单的 "App integration"
 * 5. 在 "Domain" 部分查看您的域名
 * 
 * 域名可能是以下格式之一：
 * - Amazon Cognito domain: your-prefix.auth.us-east-1.amazoncognito.com
 * - Custom domain: your-domain.com
 * 
 * 只需要填写前缀部分，例如：
 * - 如果是 "ew-logistics.auth.us-east-1.amazoncognito.com"，只填写 "ew-logistics"
 * - 如果是自定义域名，填写完整域名
 */
