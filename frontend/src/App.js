import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/common/Notification';
import { Package, BookOpen, Briefcase, ShoppingBag } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import GetQuoteLTL from './pages/GetQuoteLTL';
import Contact from './pages/Contact';
import CognitoAuth from './components/CognitoAuth';
import AuthCallback from './pages/AuthCallback';
import SeaFreightPlatform from './pages/SeaFreightPlatform';
import AirFreightPlatform from './pages/AirFreightPlatform';
import MultimodalPlatform from './pages/MultimodalPlatform';
import ComingSoonPlatform from './pages/ComingSoonPlatform';
import YellowPages from './pages/YellowPages';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import ResumeDetail from './pages/ResumeDetail';
import LogisticsRental from './pages/LogisticsRental';
import Forum from './pages/Forum';
import ArticleDetail from './pages/ArticleDetail';
import UserProfile from './pages/UserProfile';
import FreightCalculator from './pages/FreightCalculator';
import KgcmConverter from './pages/KgcmConverter';
import FBALocations from './pages/FBALocations';
import FBALocationDetail from './pages/FBALocationDetail';
import GATest from './pages/GATest';
import EmployeeOrders from './pages/EmployeeOrders';
import EmployeeAdmin from './pages/EmployeeAdmin';
import BrokerOrders from './pages/BrokerOrdersNew';
import BrokerOrderForm from './pages/BrokerOrderForm';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import Payments from './pages/Payments';
import MapView from './pages/MapView';
import AdManager from './pages/AdManager';
import AIQuoteReview from './pages/AIQuoteReview';
import DATLoadBoard from './pages/DATLoadBoard';
import DriverContacts from './pages/DriverContacts';
import MyQuotes from './pages/MyQuotes';
import QuoteDetail from './pages/QuoteDetail';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AccountingGuide from './pages/AccountingGuide';
import './App.css';
import './config/amplify'; 

// 导入 Google Maps 诊断功能
import { diagnoseGoogleMapsIssues } from './config/googleMaps';

function App() {
  const location = useLocation();
  useEffect(() => {
    // 在应用启动时运行 Google Maps 诊断
    console.log('🚀 EW 物流平台启动');
    console.log('🔍 运行 Google Maps 诊断...');
    
    // 延迟运行诊断，确保页面完全加载
    setTimeout(() => {
      diagnoseGoogleMapsIssues();
    }, 2000);
  }, []);

  // GA4 SPA 路由切换上报 - 添加调试信息
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        console.log('🟢 GA4 Loaded Successfully');
        console.log('📊 Tracking Page:', location.pathname + location.search);
        console.log('🏷️  Using GA ID: G-HFZWKT7TVE');
        
        window.gtag('config', 'G-HFZWKT7TVE', {
          page_path: location.pathname + location.search,
          debug_mode: process.env.NODE_ENV === 'development' // 开发环境启用调试
        });
      } else {
        console.warn('🔴 GA4 gtag function not available');
        console.log('🔍 Debug info:', {
          gtag_exists: typeof window.gtag,
          dataLayer_exists: !!window.dataLayer,
          dataLayer_length: window.dataLayer ? window.dataLayer.length : 0
        });
      }
    } catch (err) {
      console.error('🔴 GA4 tracking error:', err);
    }
  }, [location]);

  return (
    <NotificationProvider>
      <AuthProvider>
        <div className="App">
          <Header />
          <main>
            <Routes>
              {/* 首页 */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<CognitoAuth type="login" />} />
              <Route path="/register" element={<CognitoAuth type="register" />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* 陆运服务 */}
              <Route path="/get-quote-ltl" element={<GetQuoteLTL />} />
              <Route path="/my-quotes" element={<MyQuotes />} />
              <Route path="/quote/:sessionId" element={<QuoteDetail />} />

              {/* FBA 仓库查询 */}
              <Route path="/fba-locations" element={<FBALocations />} />
              <Route path="/fba-location/:id" element={<FBALocationDetail />} />
              
              {/* GA 测试工具 */}
              <Route path="/ga-test" element={<GATest />} />
              
              {/* 海运服务 */}
              
              <Route path="/sea-freight-logistics-container-shipping-platform-国际海运集装箱物流平台-船期运费查询与货代服务" element={<SeaFreightPlatform />} />
              
              {/* 空运服务 */}
              <Route path="/air-platform-logistics-airfreight-shipping-rates-国际空运物流平台-货运报价与航班信息查询系统" element={<AirFreightPlatform />} />
              
              {/* 多式联运 */}
              <Route path="/ddp-service" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="双清包（DDP）服务"
                  description="提供门到门的双清包服务，包含出口清关、运输、进口清关及税费"
                  actionText1="发布DDP需求"
                  actionText2="提供DDP服务"
                  searchPlaceholder="搜索目的国或货物类型"
                />
              } />
              <Route path="/ddu-service" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="单清包（DDU）服务"
                  description="提供到港的单清包服务，包含出口清关和运输，进口清关由收货人负责"
                  actionText1="发布DDU需求"
                  actionText2="提供DDU服务"
                  searchPlaceholder="搜索目的港或货物类型"
                />
              } />
              <Route path="/ldp-service" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="港口货（LDP）服务"
                  description="港口到港口的货运服务，提供最基础的运输服务，清关由客户自行处理"
                  actionText1="发布LDP需求"
                  actionText2="提供LDP服务"
                  searchPlaceholder="搜索起运港或目的港"
                />
              } />
              <Route path="/multimodal" element={<MultimodalPlatform />} />
              
              {/* 信息服务 - 使用新的完整功能页面 */}
              <Route path="/yellow-pages-logistics-supplier-directory-物流企业服务商黄页-货运卡车租赁公司查询平台" element={<YellowPages />} />
              <Route path="/jobs-driver-freight-logistics-recruitment-platform-物流司机招聘求职平台-货运卡车运输人才匹配系统" element={<Jobs />} />
              <Route path="/job/:id/:slug?" element={<JobDetail />} />
              <Route path="/resume/:id/:slug?" element={<ResumeDetail />} />
              <Route path="/logistics-truck-rental-fleet-platform-美国货运物流租车系统-卡车货车设备租赁服务信息平台" element={<LogisticsRental />} />
              <Route path="/forum-logistics-driver-community-freight-talk-物流卡车司机论坛交流平台-经验分享与行业资讯讨论区" element={<Forum />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/article/:slug" element={<ArticleDetail />} />
              
              {/* 物流工具 */}
              <Route path="/freight-calculator-logistics-shipping-estimator-tool-物流计算工具-美国物流等级class计算与换算平台" element={<FreightCalculator />} />
              <Route path="/kgcm-converter-logistics-unit-conversion-tool-公斤厘米换算工具-国际货运尺寸重量单位转换平台" element={<KgcmConverter />} />
              
              {/* 用户管理 */}
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/profile/:section" element={<UserProfile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              
              {/* 员工系统 - Broker订单系统（简化导航）*/}
              <Route path="/employee" element={<BrokerOrders />} />
              <Route path="/employee/broker-orders" element={<BrokerOrders />} />
              <Route path="/employee/broker-orders/new" element={<BrokerOrderForm />} />
              <Route path="/employee/broker-orders/:orderId" element={<BrokerOrderForm />} />
              <Route path="/employee/customers" element={<Customers />} />
              <Route path="/employee/vendors" element={<Vendors />} />
              <Route path="/employee/payments" element={<Payments />} />
              <Route path="/employee/map-view" element={<MapView />} />
              <Route path="/employee/ads" element={<AdManager />} />
              <Route path="/employee/admin" element={<EmployeeAdmin />} />
              <Route path="/employee/ai-review" element={<AIQuoteReview />} />
              <Route path="/employee/dat-loadboard" element={<DATLoadBoard />} />
              <Route path="/employee/driver-contacts" element={<DriverContacts />} />
              
              {/* 我们 */}
              <Route path="/my-points" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="我的积分"
                  description="查看积分余额、积分明细、积分商城兑换"
                  actionText1="查看积分"
                  actionText2="积分兑换"
                  searchPlaceholder="搜索积分商品"
                />
              } />
              <Route path="/recharge" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="我要充值"
                  description="账户余额充值，支持多种支付方式"
                  actionText1="立即充值"
                  actionText2="充值记录"
                  searchPlaceholder="输入充值金额"
                />
              } />
              <Route path="/my-posts" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="我的发布"
                  description="管理我发布的货源、车源、招聘等信息"
                  actionText1="发布信息"
                  actionText2="管理发布"
                  searchPlaceholder="搜索我的发布"
                />
              } />
              <Route path="/favorites" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="我的收藏"
                  description="查看收藏的货源、车源、企业等信息"
                  actionText1="查看收藏"
                  actionText2="管理收藏"
                  searchPlaceholder="搜索收藏内容"
                />
              } />
              <Route path="/my-recruitment" element={<Navigate to="/profile/myJobs" replace />} />
              <Route path="/my-job-search" element={<Navigate to="/profile/myResumes" replace />} />
              <Route path="/certification" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="我的认证"
                  description="企业认证、个人认证状态查看和管理"
                  actionText1="企业认证"
                  actionText2="个人认证"
                  searchPlaceholder="查看认证状态"
                />
              } />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/accounting-guide" element={<AccountingGuide />} />
              <Route path="/business" element={
                <ComingSoonPlatform 
                  icon={<Briefcase size={48} />}
                  title="商务合作"
                  description="寻求商业合作机会，建立合作伙伴关系"
                  actionText1="合作咨询"
                  actionText2="提交方案"
                  searchPlaceholder="搜索合作机会"
                />
              } />
              <Route path="/invite-rewards" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="邀请奖励"
                  description="邀请好友注册，获得丰厚奖励"
                  actionText1="立即邀请"
                  actionText2="查看奖励"
                  searchPlaceholder="输入邀请码"
                />
              } />
              
              {/* 保留原有路由以兼容性 */}
              <Route path="/dropshipping" element={
                <ComingSoonPlatform 
                  icon={<Package size={48} />}
                  title="一件代发平台"
                  description="电商卖家发布代发需求，代发服务商发布服务信息，实现精准的供需对接"
                  actionText1="发布代发服务"
                  actionText2="发布代发需求"
                  searchPlaceholder="搜索商品类型或代发服务商"
                />
              } />
              <Route path="/business-directory" element={
                <ComingSoonPlatform 
                  icon={<BookOpen size={48} />}
                  title="商家黄页平台"
                  description="物流行业企业信息发布平台，提供全面的物流服务商查询和企业展示服务"
                  actionText1="发布企业信息"
                  actionText2="企业认证"
                  searchPlaceholder="搜索企业名称或服务类型"
                />
              } />
              <Route path="/equipment-rental" element={
                <ComingSoonPlatform 
                  icon={<ShoppingBag size={48} />}
                  title="物流租售平台"
                  description="物流设备拥有者发布租赁信息，需求方发布租赁需求，提供设备租售撮合服务"
                  actionText1="发布设备信息"
                  actionText2="发布租赁需求"
                  searchPlaceholder="搜索设备类型或品牌"
                />
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App; 