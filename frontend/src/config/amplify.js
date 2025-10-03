import { Amplify } from 'aws-amplify';

// Amplify v6配置
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_HU9W7uLQA',
      userPoolClientId: '5mae63uesfb6dia5l06ju4j5m0',
      identityPoolId: undefined, // 不使用Federated Identities
      allowGuestAccess: false
    }
  }
};

// 导出常量供其他组件使用
export const USER_POOL_ID = 'us-east-1_HU9W7uLQA';
export const CLIENT_ID = '5mae63uesfb6dia5l06ju4j5m0';
export const CLIENT_SECRET = '20adslj0t3n45v932jclknbj7q72v58uc52dlanca2e0k9aso28';

console.log('🔧 初始化AWS Amplify v6...');

try {
  // 关键：先配置Amplify，再处理client secret
  Amplify.configure(amplifyConfig);
  
  // 对于有client secret的情况，Amplify v6会自动处理
  // 不需要在配置中包含userPoolClientSecret
  console.log('✅ AWS Amplify v6配置成功');
  console.log('📋 配置详情:', {
    userPoolId: USER_POOL_ID,
    userPoolClientId: CLIENT_ID,
    hasClientSecret: true
  });
} catch (error) {
  console.error('❌ AWS Amplify配置失败:', error);
}

export default amplifyConfig;