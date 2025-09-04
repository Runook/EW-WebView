// 直接Cognito认证工具（绕过Amplify）
import { CLIENT_ID, CLIENT_SECRET, USER_POOL_ID } from '../config/amplify';

// 计算SECRET_HASH（使用Web Crypto API）
export async function calculateSecretHash(username) {
  const message = username + CLIENT_ID;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(CLIENT_SECRET);
  const messageData = encoder.encode(message);
  
  // 导入密钥
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // 计算HMAC
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // 转换为Base64
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// 直接调用Cognito API
export async function cognitoRequest(action, params) {
  const response = await fetch(`https://cognito-idp.us-east-1.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
      'Content-Type': 'application/x-amz-json-1.1',
    },
    body: JSON.stringify(params)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Cognito API Error');
  }
  
  return data;
}

// 登录函数
export async function signIn(username, password) {
  try {
    console.log('🔐 直接Cognito登录...');
    
    // 计算SECRET_HASH
    const secretHash = await calculateSecretHash(username);
    console.log('🔑 SECRET_HASH计算成功');
    
    // 调用InitiateAuth
    const result = await cognitoRequest('InitiateAuth', {
      ClientId: CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    });
    
    console.log('✅ 登录成功!');
    
    // 保存tokens
    if (result.AuthenticationResult) {
      localStorage.setItem('accessToken', result.AuthenticationResult.AccessToken);
      localStorage.setItem('idToken', result.AuthenticationResult.IdToken);
      localStorage.setItem('refreshToken', result.AuthenticationResult.RefreshToken);
      
      // 解析用户信息
      const idToken = result.AuthenticationResult.IdToken;
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      
      return {
        success: true,
        user: {
          username: payload.email,
          attributes: {
            email: payload.email,
            given_name: payload.given_name,
            family_name: payload.family_name,
            phone_number: payload.phone_number,
            sub: payload.sub
          }
        },
        tokens: result.AuthenticationResult
      };
    }
    
    throw new Error('No authentication result');
    
  } catch (error) {
    console.error('❌ 登录失败:', error);
    throw error;
  }
}

// 注册函数
export async function signUp(username, password, attributes) {
  try {
    console.log('🔐 直接Cognito注册...');
    
    // 计算SECRET_HASH
    const secretHash = await calculateSecretHash(username);
    
    // 准备用户属性
    const userAttributes = [];
    Object.entries(attributes).forEach(([key, value]) => {
      if (value) {
        userAttributes.push({
          Name: key,
          Value: value
        });
      }
    });
    
    // 调用SignUp
    const result = await cognitoRequest('SignUp', {
      ClientId: CLIENT_ID,
      Username: username,
      Password: password,
      SecretHash: secretHash,
      UserAttributes: userAttributes
    });
    
    console.log('✅ 注册成功!');
    return {
      success: true,
      userSub: result.UserSub,
      codeDeliveryDetails: result.CodeDeliveryDetails
    };
    
  } catch (error) {
    console.error('❌ 注册失败:', error);
    throw error;
  }
}

// 确认注册
export async function confirmSignUp(username, code) {
  try {
    console.log('🔐 确认注册...');
    
    // 计算SECRET_HASH
    const secretHash = await calculateSecretHash(username);
    
    // 调用ConfirmSignUp
    const result = await cognitoRequest('ConfirmSignUp', {
      ClientId: CLIENT_ID,
      Username: username,
      ConfirmationCode: code,
      SecretHash: secretHash
    });
    
    console.log('✅ 确认成功!');
    return {
      success: true
    };
    
  } catch (error) {
    console.error('❌ 确认失败:', error);
    throw error;
  }
}

// 登出函数（本地清理）
export async function signOut() {
  console.log('🚪 退出登录...');
  
  // 清除所有tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  
  console.log('✅ 已清除所有认证信息');
  
  return { success: true };
}

// 获取当前用户（从token）
export function getCurrentUser() {
  const idToken = localStorage.getItem('idToken');
  
  if (!idToken) {
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    // 检查token是否过期
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('⚠️ Token已过期');
      signOut();
      return null;
    }
    
    return {
      username: payload.email,
      attributes: {
        email: payload.email,
        given_name: payload.given_name,
        family_name: payload.family_name,
        phone_number: payload.phone_number,
        sub: payload.sub
      }
    };
  } catch (error) {
    console.error('解析token失败:', error);
    return null;
  }
}
