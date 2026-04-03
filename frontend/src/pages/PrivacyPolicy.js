import React, { useState } from 'react';

const sectionStyle = { marginBottom: 28 };
const h2Style = { fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 10 };
const h3Style = { fontSize: 15, fontWeight: 600, color: '#1f2937', marginBottom: 8, marginTop: 16 };
const pStyle = { fontSize: 14, lineHeight: 1.8, color: '#374151', margin: '0 0 10px' };
const boldPStyle = { ...pStyle, fontWeight: 700 };
const underlineBoldStyle = { fontWeight: 700, textDecoration: 'underline' };
const ulStyle = { paddingLeft: 20, margin: '8px 0', fontSize: 14, lineHeight: 2, color: '#374151' };
const tipBoxStyle = { background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '16px 20px', marginBottom: 24 };

const PrivacyPolicy = () => {
  const [lang, setLang] = useState('zh');

  if (lang === 'en') {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Privacy Policy</h1>
          <button onClick={() => setLang('zh')} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>中文版</button>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>Last updated: March 20, 2026</p>

        <div style={tipBoxStyle}>
          <p style={{ ...pStyle, margin: 0, fontWeight: 600 }}>
            IMPORTANT: Please read our Privacy Policy carefully (especially the bold and underlined content)
            and make sure you understand how we process your personal information. If you have any questions,
            please contact us promptly. If you do not agree with any terms of this policy, you should
            immediately stop accessing Welogx.
          </p>
        </div>

        <div style={sectionStyle}>
          <p style={pStyle}>
            WELOGX TECHNOLOGY INC ("Welogx", "we", "us", or "our") operates the website
            https://welogx.com and related services (the "Service"). This Privacy Policy informs you of our policies regarding
            the collection, use, and disclosure of personal data when you use our Service and the
            choices you have associated with that data.
          </p>
          <p style={pStyle}>
            We are deeply aware of the importance of personal information to you. We respect and protect
            the personal information of all users who use the Welogx platform services and will do our
            utmost to protect the security and reliability of your personal information. We are committed
            to maintaining your trust in us and adhere to the following principles: accountability,
            purpose limitation, consent, data minimization, security, participation, and transparency.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Table of Contents</h2>
          <ul style={ulStyle}>
            <li>1. Scope of This Privacy Policy</li>
            <li>2. How We Collect and Use Your Personal Information</li>
            <li>3. How We Use Cookies and Similar Technologies</li>
            <li>4. How We Share, Transfer, and Publicly Disclose Your Personal Information</li>
            <li>5. How We Store and Protect Your Personal Information</li>
            <li>6. Your Rights to Manage Personal Information</li>
            <li>7. How We Handle Minors' Personal Information</li>
            <li>8. Updates and Notifications of This Privacy Policy</li>
            <li>9. How to Contact Us</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Scope of This Privacy Policy</h2>
          <p style={pStyle}>
            This Privacy Policy applies to your use of products or services on the Welogx platform
            (including the website https://welogx.com and any Welogx mobile applications).
            The operating entity of the Welogx platform is WELOGX TECHNOLOGY INC.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. How We Collect and Use Your Personal Information</h2>

          <h3 style={h3Style}>(1) Account Registration</h3>
          <p style={pStyle}>
            When you register a Welogx account, you need to provide your <span style={underlineBoldStyle}>email address</span> or <span style={underlineBoldStyle}>phone number</span>.
            We will verify your identity through verification codes. After logging in, you may supplement your profile
            information such as name, company, address, etc. This supplementary information helps us provide personalized
            service recommendations but is not required for basic functionality.
          </p>

          <h3 style={h3Style}>(2) Providing Our Products and Services</h3>
          <p style={pStyle}><strong>Freight Quote Service:</strong> When you request shipping quotes, we collect shipment information including
            origin/destination addresses, cargo weight, dimensions, commodity type, and <span style={underlineBoldStyle}>contact information</span>.</p>
          <p style={pStyle}><strong>Information Publishing:</strong> When you use our publishing features (equipment rental/sale, job postings,
            forum posts), we collect the content you submit including <span style={underlineBoldStyle}>contact information</span>, descriptions,
            images, and location data.</p>
          <p style={pStyle}><strong>Order Management:</strong> When you use our order management and document generation services,
            we collect shipping details, carrier information, and payment-related data.</p>
          <p style={pStyle}><strong>Resume Service:</strong> If you create a resume on our recruitment platform, you voluntarily provide
            your <span style={underlineBoldStyle}>personal employment information, education history, and contact details</span>.
            Please ensure the accuracy of your resume information.</p>

          <h3 style={h3Style}>(3) Search and Analytics</h3>
          <p style={pStyle}>
            When you use our search function, we collect your query keywords and browsing information
            to improve our services. This information generally cannot identify you individually.
          </p>

          <h3 style={h3Style}>(4) Customer Service</h3>
          <p style={pStyle}>
            When you contact us for support, we may need your <span style={underlineBoldStyle}>name, phone number, WeChat ID, or email</span> to
            assist you effectively.
          </p>

          <h3 style={h3Style}>(5) Payment Functions</h3>
          <p style={pStyle}>
            For paid services, we may collect your <span style={underlineBoldStyle}>payment account information</span> (e.g., bank account details
            for ACH/wire transfer, Zelle information) during the payment process.
          </p>

          <h3 style={h3Style}>(6) Exceptions to Consent Requirements</h3>
          <p style={pStyle}>We may collect and use necessary personal information without your consent in the following circumstances:</p>
          <ul style={ulStyle}>
            <li>Directly related to national security or public safety</li>
            <li>Directly related to criminal investigation, prosecution, trial, or enforcement</li>
            <li>To protect vital interests of you or others where consent is impractical</li>
            <li>Information you have made publicly available</li>
            <li>Information collected from legally disclosed public sources</li>
            <li>Necessary for executing contracts at your request</li>
            <li>Other circumstances provided by law</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. How We Use Cookies and Similar Technologies</h2>
          <p style={pStyle}>
            To provide you with a better experience, we may use cookies, web beacons, and similar technologies
            when you visit our platform. These help us identify you, save you from repeatedly entering registration
            information, assess account security, and analyze usage patterns.
          </p>
          <p style={pStyle}>
            We may use your browsing behavior data to display content and information related to your interests.
            If your browser allows, you can modify your Cookie acceptance settings, though this may affect
            some platform functionality.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. How We Share, Transfer, and Publicly Disclose Your Information</h2>

          <h3 style={h3Style}>(1) Sharing</h3>
          <p style={boldPStyle}>We do not sell your personal information.</p>
          <p style={pStyle}>We will not share your personal information with any company, organization, or individual outside of Welogx, except:</p>
          <ul style={ulStyle}>
            <li><strong>With explicit consent:</strong> After obtaining your consent</li>
            <li><strong>Legal requirements:</strong> As required by law, regulation, or government authorities</li>
            <li><strong>Affiliated companies:</strong> Shared with Welogx affiliates, limited to necessary information and bound by this policy</li>
            <li><strong>Authorized partners:</strong> Service providers (e.g., freight carriers, cloud hosting, payment processors) necessary to deliver our services</li>
          </ul>

          <h3 style={h3Style}>(2) Transfer</h3>
          <p style={pStyle}>
            We will not transfer your personal information except with your explicit consent or in the event of
            mergers, acquisitions, or bankruptcy, in which case the successor entity will remain bound by this policy.
          </p>

          <h3 style={h3Style}>(3) Public Disclosure</h3>
          <p style={pStyle}>
            We will only publicly disclose your personal information with your explicit consent or as required
            by law or legal proceedings.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. How We Store and Protect Your Information</h2>

          <h3 style={h3Style}>(1) Storage</h3>
          <p style={pStyle}>
            Your information is stored on servers located in the <strong>United States</strong> (AWS cloud infrastructure).
            We retain your personal information only for the duration of your use of our services and the minimum
            period required by applicable law. Browsing data such as page views and IP addresses are retained
            for no more than 1 month. Data beyond the retention period will be deleted or anonymized.
          </p>

          <h3 style={h3Style}>(2) Protection Measures</h3>
          <ul style={ulStyle}>
            <li><strong>Data Encryption:</strong> SSL/TLS encrypted transmission; sensitive data encrypted at rest</li>
            <li><strong>Identity Verification:</strong> AWS Cognito secure authentication to prevent unauthorized access</li>
            <li><strong>Access Control:</strong> Role-based permissions; employees and contractors bound by confidentiality agreements</li>
            <li><strong>Account Protection:</strong> Server backups, encrypted password storage; please safeguard your credentials</li>
            <li><strong>Incident Response:</strong> In the event of a security breach, we will promptly notify affected users via email, in-app notification, or public announcement</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Your Rights</h2>
          <p style={pStyle}>You have the right to:</p>
          <ul style={ulStyle}>
            <li>Access, update, or correct your personal information through your account settings</li>
            <li>Delete your personal information or request account cancellation</li>
            <li>Opt out of marketing communications</li>
            <li>Request a copy of your data</li>
            <li>Withdraw consent at any time</li>
            <li>Restrict processing of your personal data</li>
          </ul>
          <p style={pStyle}>
            To exercise any of these rights, please contact us using the information provided at the end of this policy.
            We may need to verify your identity before processing your request, and will respond within 15 business days.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. How We Handle Minors' Information</h2>
          <p style={pStyle}>
            Our services are primarily intended for adults (18 years of age and older). We do not knowingly collect
            personal information from children under 13. If you are a minor, please use our services under
            parental supervision and with parental consent. If we discover we have inadvertently collected
            information from a child under 13, we will promptly delete such data.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Updates to This Privacy Policy</h2>
          <p style={pStyle}>
            We may update this Privacy Policy from time to time. We will not reduce your rights under this policy
            without your explicit consent. Significant changes will be communicated through prominent notices
            on our platform or via email. Significant changes include but are not limited to:
          </p>
          <ul style={ulStyle}>
            <li>Major changes to our service model or how we process personal information</li>
            <li>Significant changes in ownership structure or organizational architecture</li>
            <li>Changes to the primary recipients of shared, transferred, or disclosed information</li>
            <li>Major changes to your rights and how they may be exercised</li>
            <li>Changes to our data protection department or contact methods</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. How to Contact Us</h2>
          <p style={pStyle}>
            If you have any questions about this Privacy Policy or if your personal information has been compromised,
            please contact us. We have established a dedicated personal information protection department and
            will respond to your inquiry within 15 business days.
          </p>
          <ul style={ulStyle}>
            <li>Email: ftl.us48@gmail.com</li>
            <li>WeChat: welogx</li>
            <li>Address: 55 Kennedy Dr, Hauppauge, NY 11788, USA</li>
            <li>Website: https://welogx.com</li>
          </ul>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, marginTop: 40 }}>
          <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
            © {new Date().getFullYear()} WELOGX TECHNOLOGY INC. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Welogx 隐私政策</h1>
        <button onClick={() => setLang('en')} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>English</button>
      </div>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>最后更新：2026年3月20日</p>

      {/* 特别提示 */}
      <div style={tipBoxStyle}>
        <p style={{ ...pStyle, margin: 0, fontWeight: 600 }}>
          【特别提示】请您仔细阅读我们的《Welogx 隐私政策》（尤其是<span style={underlineBoldStyle}>加粗划线的内容</span>）并确定了解我们对您个人信息的处理规则。
          阅读过程中，如您有任何疑问，可及时与我们联系（联系方式以隐私政策里约定的为准）。如您不同意协议中的任何条款，您应立即停止访问 Welogx。
        </p>
      </div>

      {/* 引言 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>引言</h2>
        <p style={pStyle}>《Welogx 隐私政策》将帮助您了解以下内容：</p>
        <ul style={{ ...ulStyle, listStyleType: 'decimal' }}>
          <li>我们如何收集和使用您的个人信息</li>
          <li>我们如何使用 Cookie 和同类技术</li>
          <li>我们如何共享、转让、公开披露您的个人信息</li>
          <li>我们如何存储及保护您的个人信息</li>
          <li>您管理个人信息的权利</li>
          <li>我们如何处理未成年人的个人信息</li>
          <li>本隐私政策如何更新</li>
          <li>如何联系我们</li>
        </ul>
        <p style={pStyle}>
          WELOGX TECHNOLOGY INC（以下亦称"Welogx"或"我们"）深知个人信息对您的重要性，我们尊重并保护所有使用 Welogx 平台服务的用户的个人信息，
          并会尽全力保护您的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您的个人信息：
          <strong>权责一致原则、目的明确原则、选择同意原则、最少够用原则、确保安全原则、主体参与原则、公开透明原则</strong>。
          同时，我们承诺，我们将按业界成熟的安全标准，采取相应的安全保护措施来保护您的个人信息。
        </p>
        <p style={pStyle}>
          请在使用我们的产品（或服务）前，仔细阅读并了解本《Welogx 隐私政策》（下称"本隐私政策"）。
        </p>
        <p style={pStyle}>
          如您对本隐私政策有任何疑问或您在使用我们提供的服务时个人信息受到了侵扰，您可以通过本政策末尾提供的联系方式咨询我们，
          我们设立了个人信息保护专职部门，将尽快给予您答复，以便我们能够及时解决您的困惑。
        </p>
      </div>

      {/* 目录 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>目录</h2>
        <ul style={ulStyle}>
          <li>一、本隐私政策的适用范围</li>
          <li>二、我们如何收集和使用您的个人信息</li>
          <li>三、我们如何使用 Cookie 和同类技术</li>
          <li>四、我们如何共享、转让、公开披露您的个人信息</li>
          <li>五、我们如何存储及保护您的个人信息</li>
          <li>六、您管理个人信息的权利</li>
          <li>七、我们如何处理未成年人的个人信息</li>
          <li>八、本隐私政策的更新和通知</li>
          <li>九、如何联系我们</li>
        </ul>
      </div>

      {/* 一、适用范围 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>一、本隐私政策的适用范围</h2>
        <p style={pStyle}>
          本隐私政策适用于您使用 Welogx 平台（包括 Welogx 网站 https://welogx.com 及 Welogx 移动应用软件）的产品或服务时使用。
          Welogx 平台的运营主体为美国 WELOGX TECHNOLOGY INC。
        </p>
      </div>

      {/* 二、收集和使用 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>二、我们如何收集和使用您的个人信息</h2>
        <p style={pStyle}>
          个人信息是指以电子或者其他方式记录的能够单独或者与其他信息结合识别特定自然人身份或者反映特定自然人活动情况的各种信息。
        </p>
        <p style={pStyle}>
          个人敏感信息是指一旦泄露、非法提供或滥用可能危害人身和财产安全，极易导致个人名誉、身心健康受到损害或歧视性待遇等的个人信息。
          本隐私政策涉及到的个人敏感信息我们将以<span style={underlineBoldStyle}>加粗并加下划线</span>的方式提示您注意阅读。
          在您向 Welogx 提供任何属于敏感信息的个人信息前，请您清楚考虑该等提供是恰当的并且同意您的个人敏感信息可按本隐私政策所述的目的和方式进行处理。
        </p>
        <p style={pStyle}>
          原则上，Welogx 仅会出于本隐私政策所述的以下目的，收集和使用您的个人信息。Welogx 是综合类的物流服务与信息发布平台，
          所涉场景较多，如果超过以下目的收集和使用您的个人信息时我们会单独向您提示并征得您的同意。
        </p>

        <h3 style={h3Style}>（一）帮助您成为我们的注册/登录用户</h3>
        <p style={pStyle}>
          您在使用 Welogx 提供的服务时，首先需要成为我们的注册/登录用户。当您注册 Welogx 账户时，
          您需要向我们提供您的<span style={underlineBoldStyle}>电子邮箱地址和/或手机号码</span>，
          我们将通过发送验证码的方式来验证您的身份是否有效。您登录后可以继续完善您的账户信息，
          您可以修改补充您的姓名、公司名称、地址、职业等。您补充的账户信息将有助于我们为您提供个性化的服务推荐和更优的服务体验，
          但如果您不提供这些补充信息，不会影响您使用 Welogx 的基本功能。
        </p>
        <p style={pStyle}>
          您提供的上述信息，将在您使用 Welogx 服务期间持续授权我们使用。在您注销账号时，我们将停止使用并删除上述信息。
          上述信息将存储于美国境内。如需跨境传输，我们将会单独征得您的授权同意。
        </p>

        <h3 style={h3Style}>（二）向您提供我们的产品或服务</h3>

        <p style={pStyle}><strong>1、货运报价服务</strong></p>
        <p style={pStyle}>
          当您使用 Welogx 的 LTL/FTL 货运报价功能时，我们会收集您的货运信息，包括
          <span style={underlineBoldStyle}>发货地址、收货地址、货物重量、尺寸、商品类型、联系方式</span>。
          此类信息为您自主填写的信息，收集是为了方便您获取准确的货运报价。
        </p>

        <p style={pStyle}><strong>2、订单管理与单据服务</strong></p>
        <p style={pStyle}>
          当您使用我们的订单管理、货物追踪和单据生成（提单BOL、费率确认单、发票、报价单）服务时，
          我们会收集<span style={underlineBoldStyle}>发货人/收货人信息、承运人信息、货物详情、付款信息</span>等。
        </p>

        <p style={pStyle}><strong>3、信息发布功能</strong></p>
        <p style={pStyle}>
          Welogx 平台提供物流设备租售、招聘求职、社区论坛等信息发布功能。当您使用发布功能时，
          我们会收集您的个人信息（信息品类不同，收集的信息不一样），包括<span style={underlineBoldStyle}>姓名、联系方式、微信号、邮箱、地址信息</span>。
          此类信息为您自己主动填写的信息，收集是为了方便您能成功发布信息。
        </p>
        <ul style={ulStyle}>
          <li>您发布物流设备<strong>租赁/出售</strong>信息时，需提供设备信息、价格信息、联系方式、位置信息。</li>
          <li>您发布<strong>招聘</strong>信息时，除了提交拟招聘岗位的信息还需要提交您的<span style={underlineBoldStyle}>联系方式</span>，以便求职者能够联系到您。</li>
          <li>您发布<strong>求职简历</strong>时，为了能够更好的为您提供求职服务，建议您如实填写简历信息。如因您自身填写的简历虚假等问题引起的任何争议，您应自行承担。</li>
          <li>您在<strong>社区论坛</strong>发布内容时，我们会收集您发布的文字、图片等信息。</li>
          <li>您使用<strong>FBA仓库预约交换</strong>服务时，我们会收集您的仓库预约相关信息。</li>
        </ul>

        <p style={pStyle}><strong>4、搜索功能</strong></p>
        <p style={pStyle}>
          当使用 Welogx 提供的搜索功能时，我们会收集您查询的关键字信息以及您在使用 Welogx 服务时所浏览的其他信息和内容详情。
          该等关键词信息通常无法单独识别您的个人身份，不属于您的个人信息。
          只有当您的搜索关键词信息与您的其他信息有联结并可识别您的个人身份时，
          我们会将您的搜索关键词信息作为您的个人信息，按照本隐私政策对其进行处理与保护。
        </p>

        <p style={pStyle}><strong>5、客户服务</strong></p>
        <p style={pStyle}>
          当您向 Welogx 发布信息、申诉或进行咨询时，为了方便与您联系或帮助您解决问题，
          我们可能需要您提供<span style={underlineBoldStyle}>姓名、手机号码、微信号、电子邮件</span>信息。
          如您拒绝提供上述信息，可能部分功能无法使用，同时无法向您及时反馈申诉或咨询结果。
        </p>

        <p style={pStyle}><strong>6、支付功能</strong></p>
        <p style={pStyle}>
          您可在 Welogx 进行部分服务支付购买。在您使用该服务的过程中可能会需要进行支付，
          在支付过程中，我们可能会收集您的<span style={underlineBoldStyle}>第三方支付帐号（例如银行账户信息、Zelle 信息、ACH/电汇信息）</span>。
        </p>

        <p style={pStyle}><strong>7、为您提供更个性化的服务</strong></p>
        <ul style={ulStyle}>
          <li><strong>基于位置信息的个性化推荐：</strong>我们会收集您的位置信息（我们仅收集您当时所处的地理位置，但不会将您各时段的位置信息进行结合以判断您的行踪轨迹）来判断您所处的地点，为您推荐附近的物流服务信息。</li>
          <li><strong>基于图片上传的功能：</strong>您可以在 Welogx 上传照片来实现设备展示、论坛发帖、货物照片等功能。</li>
        </ul>
        <p style={pStyle}>
          上述附加功能可能需要您在设备中向我们开启地理位置、相机、相册等权限，以实现这些功能所涉及的信息的收集和使用。
          <strong>请您注意，您开启这些权限即代表您授权我们可以收集和使用这些个人信息来实现上述功能，
          您关闭权限即代表您取消了这些授权，则我们将不再继续收集和使用您的这些个人信息，也无法为您提供上述与这些授权所对应的功能。</strong>
        </p>

        <p style={pStyle}><strong>8、其他服务</strong></p>
        <ul style={ulStyle}>
          <li>除上述服务外，我们还可能为了提供服务及改进服务质量的合理需要而收集您的其他信息，包括您与我们的客户服务团队联系时所提供的相关信息。</li>
          <li>在不透露单个用户隐私资料的前提下，Welogx 有权对整个用户数据库进行分析并对用户数据库进行商业上的利用。这些统计信息不包含您的任何身份识别信息。</li>
          <li>您可以通过联系客服申请注销 Welogx 账号。除法律法规另有规定外，注销账号之后我们将停止为您提供服务，并根据本协议约定期限保存您的个人信息，保存期限届满后我们将对您的个人信息进行匿名化处理。</li>
        </ul>

        <h3 style={h3Style}>（三）无需征得授权同意的情形</h3>
        <p style={pStyle}>根据相关法律法规的规定，在以下情形中，我们可以在不征得您的授权同意的情况下收集、使用一些必要的个人信息：</p>
        <ul style={{ ...ulStyle, listStyleType: 'decimal' }}>
          <li>与国家安全、国防安全直接相关的</li>
          <li>与公共安全、公共卫生、重大公共利益直接相关的</li>
          <li>与犯罪侦查、起诉、审判和判决执行等直接相关的</li>
          <li>出于维护您或其他个人的生命、财产等重大合法权益但又很难得到本人同意的</li>
          <li>所收集的个人信息是您自行向社会公众公开的</li>
          <li>从合法公开披露的信息中收集到的</li>
          <li>根据您的要求签订和履行合同所必需的</li>
          <li>法律法规规定的其他情形</li>
        </ul>
        <p style={boldPStyle}>
          您知悉并认可：Welogx 通过广告或其他方式向您提供链接，使您可以接入第三方服务或网站。
          您使用该等第三方的服务时，须受该第三方的服务条款及隐私政策约束，Welogx 提示您需要仔细阅读其政策。
          本协议仅适用于 Welogx 提供的服务器所收集的信息，并不适用于第三方提供的服务或第三方的信息使用的规则，
          Welogx 对第三方使用由您自行提供的信息不承担责任。
        </p>
      </div>

      {/* 三、Cookie */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>三、我们如何使用 Cookie 和同类技术</h2>
        <p style={pStyle}>
          为使您获得更轻松的访问体验，您访问 Welogx 平台相关网站或使用 Welogx 平台提供的服务时，
          我们可能会通过小型数据文件识别您的身份，这么做是帮您省去重复输入注册信息的步骤，或者帮助判断您的账户安全。
          这些数据文件可能是 Cookie、Flash Cookie，或您的浏览器提供的其他本地存储（统称"Cookie"）。
        </p>
        <p style={pStyle}>
          网页上常会包含一些电子图象（称为"单像素"GIF 文件或"网络 beacon"），使用网络 beacon 可以帮助网站计算浏览网页的用户或访问某些 Cookie，
          我们会通过网络 beacon 收集您浏览网页活动的信息，例如您访问的页面地址、停留时间、浏览环境以及显示设定等。
        </p>
        <p style={pStyle}>
          Welogx 可能使用您在 Welogx 网站浏览的行为数据，根据您的兴趣喜好，在您浏览网站时展现与您兴趣相关的信息或内容。
          我们不会将上述技术收集的信息用于本隐私政策所述目的之外的任何用途。
          请您理解，我们的某些服务只能通过使用"Cookie"才可得到实现。
          如果您的浏览器允许，您可以修改对 Cookie 的接受程度，但这一举动在某些情况下可能会影响您正常使用 Welogx 平台提供的服务。
        </p>
      </div>

      {/* 四、共享、转让、公开披露 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>四、我们如何共享、转让、公开披露您的个人信息</h2>

        <h3 style={h3Style}>（一）共享</h3>
        <p style={boldPStyle}>我们不会向 Welogx 以外的任何公司、组织和个人出售您的个人信息。</p>
        <p style={pStyle}>但以下情况除外：</p>
        <ul style={{ ...ulStyle, listStyleType: 'decimal' }}>
          <li><strong>在获得明确同意的情况下共享：</strong>获得您的明确同意后，我们会与其他方共享您的个人信息。</li>
          <li><strong>根据法律法规的规定和行政、司法机构的要求：</strong>我们可能会根据法律法规规定，或按政府主管部门的强制性要求，向上述监管部门共享您的个人信息。</li>
          <li><strong>与我们的关联公司共享：</strong>您的个人信息可能会与 Welogx 的关联公司共享。我们只会共享必要的个人信息，且受本隐私政策中所声明目的的约束。</li>
          <li>
            <strong>与授权合作伙伴共享：</strong>仅为实现本隐私政策中声明的目的，我们的某些服务将由授权合作伙伴提供。目前，我们的授权合作伙伴包括：
            <ul style={{ ...ulStyle, marginTop: 4 }}>
              <li><strong>物流服务商：</strong>货运承运人、仓储服务商等，为完成您的货运订单所必需。</li>
              <li><strong>技术服务商：</strong>云服务（AWS）、支付处理商等协助运营平台的第三方公司。</li>
              <li><strong>数据分析服务商：</strong>我们可能会将经处理无法识别您身份的匿名化信息与分析服务商共享，以分析产品和服务使用情况。</li>
            </ul>
          </li>
        </ul>
        <p style={pStyle}>
          对我们与之共享个人信息的公司、组织和个人，我们会与其签署严格的保密协定，
          要求他们按照我们的说明、本隐私政策以及其他任何相关的保密和安全措施来处理个人信息。
        </p>

        <h3 style={h3Style}>（二）转让</h3>
        <p style={pStyle}>
          我们不会将您的个人信息转让给任何公司、组织和个人，但以下情况除外：
        </p>
        <ul style={{ ...ulStyle, listStyleType: 'decimal' }}>
          <li><strong>在获取明确同意的情况下转让：</strong>获得您的明确同意后，我们会向其他方转让您的个人信息。</li>
          <li><strong>在涉及合并、收购或破产清算时：</strong>如涉及到个人信息转让，我们会在要求新的持有您个人信息的公司、组织继续受此隐私政策的约束，否则我们将要求该公司、组织重新向您征求授权同意。</li>
        </ul>

        <h3 style={h3Style}>（三）公开披露</h3>
        <p style={pStyle}>我们仅会在以下情况下，公开披露您的个人信息：</p>
        <ul style={{ ...ulStyle, listStyleType: 'decimal' }}>
          <li>获得您明确同意后；</li>
          <li>基于法律的披露：在法律、法律程序、诉讼或政府主管部门强制性要求的情况下，我们可能会对上述监管部门披露您的个人信息。</li>
        </ul>
        <p style={pStyle}>
          因此，请您谨慎考虑通过我们的服务上传、发布和交流的信息内容。
          如要求从我们的服务中删除您的相关信息，请通过本隐私政策文首处提供的联系方式操作。
        </p>
      </div>

      {/* 五、存储及保护 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>五、我们如何存储及保护您的个人信息</h2>

        <h3 style={h3Style}>（一）信息存储</h3>
        <p style={pStyle}>
          Welogx 收集的有关您的信息和资料将保存在 Welogx 的服务器上（AWS 美国区域），这些信息和资料<strong>全部储存在美国境内</strong>。
          目前，Welogx 的产品和服务不会涉及到数据的跨境传输，如果我们的产品/服务发生变更，涉及数据的跨境传输，
          我们会单独向您以弹窗或邮件的方式告知您数据出境的目的、接收方等，并征得您的授权同意。
        </p>
        <p style={pStyle}>
          我们仅在您使用我们的服务期间和法律法规要求的最短时限内保留您的个人信息。
          在仅浏览功能下所收集的个人信息如浏览记录、IP 信息，我们的存储期限不会超过1个月。
          订单和货运记录可能会保留最长7年，以符合会计和法律合规要求。
          对于超出期限的个人信息，我们会立即删除或做匿名化处理。
        </p>

        <h3 style={h3Style}>（二）信息保护</h3>
        <p style={pStyle}>
          为保障您的信息安全，我们努力采取各种合理的物理、电子和管理方面的安全措施来保护您的信息，
          使您的信息不会被泄漏、毁损或者丢失，包括但不限于 SSL/TLS 加密传输、信息加密存储、数据中心的访问控制。
        </p>
        <ul style={{ ...ulStyle, listStyleType: 'decimal' }}>
          <li><strong>数据加密：</strong>我们对用户的敏感信息进行加密存储和传输（SSL/TLS），保证用户基本信息不会被恶意获取。</li>
          <li><strong>身份鉴别：</strong>我们通过 AWS Cognito 安全认证系统校验账号密码或验证码，进行用户身份合法性鉴别，防止非经授权的介入。</li>
          <li><strong>访问控制：</strong>我们对可能接触到您的信息的员工或外包人员也采取了严格管理，包括但不限于根据岗位的不同采取不同的权限控制，与他们签署保密协议，监控他们的操作情况等措施。</li>
          <li><strong>安全审计：</strong>我们会对一些场景或行为进行监测，如通过流量分析，完成账号异常登陆、注册等异常行为的监控。</li>
          <li><strong>账号保护：</strong>您的账户均有安全保护功能，请妥善保管您的账户及密码信息。Welogx 将通过向其它服务器备份、对用户密码进行加密等安全措施确保您的信息不丢失，不被滥用和变造。尽管有前述安全措施，但同时也请您理解，由于技术的限制以及可能存在的各种恶意手段，即便竭尽所能加强安全措施，在信息网络上也不存在"完善的安全措施"。<strong>如因您自己的原因导致账户及密码信息泄露而造成的任何法律后果需由您本人负责。</strong></li>
        </ul>
        <p style={pStyle}>
          在使用 Welogx 平台服务进行网上交易时，如您不可避免地要向交易对方或潜在的交易对方披露自己的个人信息（例如联系人、联络方式等），
          请您妥善保护自己的个人信息，仅在必要的情形下向他人提供。如您发现自己的个人信息已经被泄露或者存在被泄露的可能，
          请您务必在第一时间通过本隐私政策提供的联系方式与我们取得联系，以便我们采取相应措施。
        </p>
        <p style={pStyle}>
          互联网环境并非百分之百安全，我们将尽力确保您发送给我们的任何信息的安全性。
          在不幸发生个人信息安全事件后，我们将按照法律法规的要求，及时向您告知：安全事件的基本情况和可能的影响、
          我们已采取或将要采取的处置措施、您可自主防范和降低风险的建议、对您的补救措施等。
          我们将及时将事件相关情况以邮件、电话、推送通知等方式告知您，难以逐一告知个人信息主体时，我们会采取合理、有效的方式发布公告。
        </p>
      </div>

      {/* 六、您的权利 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>六、您管理个人信息的权利</h2>
        <p style={pStyle}>
          Welogx 非常重视您对个人信息的关注，并尽全力保护您对于自己个人信息访问、更正、删除以及撤回同意的权利，
          以使您拥有充分的能力保障您的隐私和安全。您的权利包括：
        </p>

        <h3 style={h3Style}>（一）个人信息的查询、更正</h3>
        <p style={pStyle}>您有权访问您的个人信息，法律法规规定的例外情况除外。如果您想行使数据访问权，可以通过以下方式自行访问：</p>
        <ul style={ulStyle}>
          <li>您可以在 Welogx 网站登录后，通过"个人中心"访问、更正您的账户信息、个人资料。</li>
          <li>您的简历信息可以通过"个人中心"的相关页面进行查询、更正、删除。</li>
          <li>您发布的物流租售信息、招聘信息、论坛内容可以在"我的发布"页面进行管理。</li>
        </ul>

        <h3 style={h3Style}>（二）个人信息的删除</h3>
        <p style={pStyle}>您可以通过联系客服申请删除您的个人信息或注销您的账号。</p>

        <h3 style={h3Style}>（三）撤回同意</h3>
        <p style={pStyle}>
          您可以通过关闭设备权限（如位置、相机、相册等）来撤回对相关个人信息收集的同意。
          您也可以通过联系客服的方式撤回其他形式的同意。
        </p>

        <h3 style={h3Style}>（四）共享、转让、公开披露个人信息时事先征得授权同意的例外</h3>
        <p style={pStyle}>根据法律规定，在以下情形中，我们共享、转让、公开披露您的个人信息无需事先征得您的授权同意：</p>
        <ul style={ulStyle}>
          <li>与国家安全、国防安全直接相关的</li>
          <li>与公共安全、公共卫生、重大公共利益直接相关的</li>
          <li>与犯罪侦查、起诉、审判和判决执行等直接相关的</li>
          <li>出于维护个人信息主体或其他个人的生命、财产等重大合法权益但又很难得到本人同意的</li>
          <li>个人信息主体自行向社会公众公开的个人信息</li>
          <li>从合法公开披露的信息中收集个人信息的</li>
        </ul>

        <h3 style={h3Style}>（五）响应您的请求</h3>
        <p style={pStyle}>
          为保障安全，您可能需要提供书面请求，或以其他方式证明您的身份。我们可能会先要求您验证自己的身份，然后再处理您的请求。
          我们将在十五个工作日内回复您的请求。
        </p>
      </div>

      {/* 七、未成年人 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>七、我们如何处理未成年人的个人信息</h2>
        <p style={pStyle}>
          1、Welogx 主要为物流服务及生活服务类平台，我们的服务主要面向成年人（原则上18周岁以上为成年人，
          16周岁以上且以自己的劳动收入为主要生活来源的我们亦视为成年人）。若您是未成年人，在使用我们的产品和/或服务前，
          您应在监护人的陪同下阅读本隐私政策，并应确保已征得您的监护人同意后使用我们的服务并向我们提供您的信息。
          我们会根据相关法律法规的规定着重保护未成年人的个人信息。
        </p>
        <p style={pStyle}>
          2、如您的监护人不同意您按照本隐私政策使用我们的服务或向我们提供信息，请您立即终止使用我们的服务并及时通知我们。
        </p>
        <p style={pStyle}>
          3、<strong>未经父母双方同意，我们不会有意收集十三（13）岁以下儿童的个人身份信息。</strong>
          如果确定不小心收集了十三（13）岁以下人士的此类信息，我们将立即采取必要步骤，
          以确保从我们的系统数据库中删除此类信息。未满十三（13）岁的任何人都必须寻求并获得父母或监护人的许可才能使用本网站。
          对于经父母或法定监护人同意而收集未成年人个人信息的情况，
          我们只会在受到法律允许、父母或监护人明确同意或者保护未成年人所必要的情况下使用或公开披露此信息。
        </p>
        <p style={pStyle}>
          4、若您是未成年人的监护人，当您对您所监护的未成年人使用我们的服务或其向我们提供的用户信息有任何疑问时，
          请您及时与我们联系。我们将根据相关法律法规及本隐私政策的规定保护未成年人用户信息的保密性及安全性。
        </p>
      </div>

      {/* 八、更新和通知 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>八、本隐私政策的更新和通知</h2>
        <p style={pStyle}>
          我们的隐私政策可能变更。<strong>未经您明确同意，我们不会削减您按照本隐私政策所应享有的权利。</strong>
          我们会在本页面上发布对本隐私政策所做的任何变更。
        </p>
        <p style={pStyle}>
          对于重大变更，我们还会提供更为显著的通知（包括对于某些服务，我们会通过电子邮件发送通知，说明隐私政策的具体变更内容）。
          本隐私政策所指的重大变更包括但不限于：
        </p>
        <ul style={{ ...ulStyle, listStyleType: 'decimal' }}>
          <li>我们的服务模式发生重大变化。如处理个人信息的目的、处理的个人信息类型、个人信息的使用方式等；</li>
          <li>我们在所有权结构、组织架构等方面发生重大变化。如业务调整、破产并购等引起的所有者变更等；</li>
          <li>个人信息共享、转让或公开披露的主要对象发生变化；</li>
          <li>您参与个人信息处理方面的权利及其行使方式发生重大变化；</li>
          <li>我们负责处理个人信息安全的责任部门、联络方式及投诉渠道发生变化时；</li>
          <li>个人信息安全影响评估报告表明存在高风险时。</li>
        </ul>
        <p style={pStyle}>
          您可以在 Welogx 网站底部查看到我们最新版本的《Welogx 隐私政策》。
        </p>
      </div>

      {/* 九、联系我们 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>九、如何联系我们</h2>
        <p style={pStyle}>
          如您对本隐私政策有任何疑问或您在使用我们提供的服务时个人信息受到了侵扰，您可以通过以下方式联系我们。
          我们设立了个人信息保护专职部门，将尽快给予您答复。一般情况下，我们将在十五个工作日内回复。
        </p>
        <ul style={ulStyle}>
          <li>电子邮箱：ftl.us48@gmail.com</li>
          <li>微信：welogx</li>
          <li>地址：55 Kennedy Dr, Hauppauge, NY 11788, USA</li>
          <li>网站：https://welogx.com</li>
        </ul>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, marginTop: 40 }}>
        <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
          © {new Date().getFullYear()} WELOGX TECHNOLOGY INC. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
