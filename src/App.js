import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { Package, BookOpen, Briefcase, ShoppingBag } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import FreightBoard from './pages/FreightBoard';
import Contact from './pages/Contact';
import SeaFreightPlatform from './pages/SeaFreightPlatform';
import AirFreightPlatform from './pages/AirFreightPlatform';
import MultimodalPlatform from './pages/MultimodalPlatform';
import ComingSoonPlatform from './pages/ComingSoonPlatform';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/freight-board" element={<FreightBoard />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/sea-freight" element={<SeaFreightPlatform />} />
            <Route path="/air-freight" element={<AirFreightPlatform />} />
            <Route path="/multimodal" element={<MultimodalPlatform />} />
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
            <Route path="/jobs" element={
              <ComingSoonPlatform 
                icon={<Briefcase size={48} />}
                title="招聘求职平台"
                description="物流企业发布招聘信息，求职者发布简历信息，提供精准的人才匹配服务"
                actionText1="发布职位"
                actionText2="投递简历"
                searchPlaceholder="搜索职位名称或公司"
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
    </LanguageProvider>
  );
}

export default App; 