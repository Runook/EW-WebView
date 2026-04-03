import React, { useState } from 'react';

const sectionStyle = { marginBottom: 28 };
const h2Style = { fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 10 };
const h3Style = { fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 8 };
const pStyle = { fontSize: 14, lineHeight: 1.8, color: '#374151', margin: '0 0 10px' };
const boldPStyle = { ...pStyle, fontWeight: 700 };
const ulStyle = { paddingLeft: 20, margin: '8px 0', fontSize: 14, lineHeight: 2, color: '#374151' };

const TermsOfService = () => {
  const [lang, setLang] = useState('zh');

  if (lang === 'en') {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Terms of Service</h1>
          <button onClick={() => setLang('zh')} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>中文版</button>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>Last updated: March 20, 2026</p>

        <div style={sectionStyle}>
          <p style={pStyle}>
            Welcome to Welogx. These Terms of Service ("Terms") govern your use of the website
            https://welogx.com and related services (the "Service") operated by WELOGX TECHNOLOGY INC
            ("Welogx", "we", "us", or "our"). By accessing or using the Service, you agree to be
            bound by these Terms and our Privacy Policy.
          </p>
          <p style={boldPStyle}>
            PLEASE READ THESE TERMS CAREFULLY. BY USING OUR SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ,
            UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE, YOU MAY NOT USE THE SERVICE.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Definitions</h2>
          <ul style={ulStyle}>
            <li><strong>Welogx Platform:</strong> The website (https://welogx.com) and any mobile applications operated by WELOGX TECHNOLOGY INC.</li>
            <li><strong>User:</strong> Any individual or entity that accesses or uses the Welogx Platform, including registered and non-registered users.</li>
            <li><strong>Services:</strong> All services provided through the Welogx Platform, including but not limited to freight quoting, order management, logistics equipment rental/sale, job recruitment, community forum, and FBA appointment exchange.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Account Registration</h2>
          <ul style={ulStyle}>
            <li>You must be at least 18 years old and have the legal capacity to enter into this agreement.</li>
            <li>You must provide accurate and complete information during registration and keep it updated.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You may not transfer, lend, or sell your account to any third party.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Description of Services</h2>
          <p style={pStyle}>Welogx is a logistics technology platform that provides:</p>
          <ul style={ulStyle}>
            <li>Freight shipping quotes (LTL, FTL, and other modes)</li>
            <li>Order management and shipment tracking</li>
            <li>Document generation (BOL, Rate Confirmation, Invoices, Quotations)</li>
            <li>Logistics equipment rental and sale marketplace</li>
            <li>Logistics industry job recruitment platform</li>
            <li>Community forum for industry information exchange</li>
            <li>FBA warehouse appointment exchange</li>
            <li>Freight calculator and conversion tools</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Shipping and Freight Services</h2>
          <p style={pStyle}>Welogx acts as a logistics intermediary connecting shippers with freight carriers. While we strive to provide accurate quotes and reliable service:</p>
          <ul style={ulStyle}>
            <li>Freight rates are estimates and may be subject to adjustment based on actual shipment details.</li>
            <li>Transit times are estimates and not guaranteed unless explicitly stated.</li>
            <li>Claims for damaged or lost freight are subject to carrier liability limits and applicable regulations.</li>
            <li>Users are responsible for providing accurate shipment information including weight, dimensions, and commodity details.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. User Conduct</h2>
          <p style={pStyle}>You agree not to:</p>
          <ul style={ulStyle}>
            <li>Use the Service for any unlawful purpose or to ship prohibited items</li>
            <li>Post false, misleading, defamatory, or fraudulent information</li>
            <li>Infringe upon the intellectual property or privacy rights of others</li>
            <li>Interfere with or disrupt the Service or its servers</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Scrape, data-mine, or use automated means to access the Service without permission</li>
            <li>Register multiple accounts for fraudulent purposes</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Payment Terms</h2>
          <ul style={ulStyle}>
            <li>Payment terms are as specified in individual invoices (typically Net 30 or Due on Receipt).</li>
            <li>Late payments may be subject to late fees as agreed upon.</li>
            <li>We accept payment via check, ACH, Zelle, and wire transfer.</li>
            <li>All prices are in US Dollars (USD) unless otherwise stated.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Intellectual Property</h2>
          <p style={pStyle}>
            The Service and its original content, features, functionality, trademarks, logos, and software are owned by
            WELOGX TECHNOLOGY INC and are protected by United States and international copyright, trademark,
            and other intellectual property laws. You may not reproduce, distribute, modify, or create
            derivative works without our express written permission.
          </p>
          <p style={pStyle}>
            By posting content on the Welogx Platform, you grant Welogx a non-exclusive, worldwide, royalty-free license
            to use, display, and distribute such content in connection with the Service.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Limitation of Liability</h2>
          <p style={boldPStyle}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WELOGX TECHNOLOGY INC SHALL NOT BE LIABLE FOR
            ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT
            NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR
            RELATED TO YOUR USE OF THE SERVICE.
          </p>
          <p style={pStyle}>
            Welogx does not guarantee the accuracy, completeness, or reliability of any information posted by users.
            Users should exercise their own judgment regarding the authenticity and legality of such information.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Indemnification</h2>
          <p style={pStyle}>
            You agree to indemnify and hold harmless WELOGX TECHNOLOGY INC, its officers, directors,
            employees, and agents from any claims, damages, or expenses arising from your use of the
            Service or violation of these Terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Termination</h2>
          <p style={pStyle}>
            We may suspend or terminate your access to the Service at any time for violation of these Terms.
            Upon termination, we may retain your data as required by law. You may stop using the Service at any time.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Governing Law</h2>
          <p style={pStyle}>
            These Terms shall be governed by and construed in accordance with the laws of the
            State of New York, United States. Any disputes shall be resolved in the courts located
            in Suffolk County, New York.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>12. Changes to Terms</h2>
          <p style={pStyle}>
            We reserve the right to modify these Terms at any time. Significant changes will be posted on this page.
            Your continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>13. Contact Us</h2>
          <ul style={ulStyle}>
            <li>Email: ftl.us48@gmail.com</li>
            <li>WeChat: welogx</li>
            <li>Address: 55 Kennedy Dr, Hauppauge, NY 11788</li>
            <li>Website: https://welogx.com</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Welogx 使用协议</h1>
        <button onClick={() => setLang('en')} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>English</button>
      </div>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>最后更新：2026年3月20日</p>

      <div style={sectionStyle}>
        <p style={pStyle}>
          欢迎您使用 Welogx 的服务！为使用 Welogx 的服务，您应当阅读并遵守《Welogx 使用协议》和《Welogx 隐私权条款》。
          本协议是用户与 Welogx 之间的法律协议，是用户注册 Welogx 平台账号和/或使用 Welogx 服务时使用的通用条款。
        </p>
        <p style={boldPStyle}>
          请您务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款、管辖与法律适用条款。
          限制、免责条款以加粗形式提示您重点注意。除非您已阅读并接受本协议所有条款，否则您无权使用 Welogx 提供的服务。
          您使用 Welogx 的服务即视为您已阅读并同意上述协议的约束。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>一、定义</h2>
        <p style={pStyle}>
          <strong>Welogx 平台</strong>，是指美国 WELOGX TECHNOLOGY INC（以下简称"Welogx"）旗下运营的 Welogx 网站（https://welogx.com）及相关移动应用软件。
        </p>
        <p style={pStyle}>
          <strong>用户</strong>，包含注册用户和非注册用户，以下亦称为"您"。注册用户是指通过 Welogx 平台完成全部注册程序后，使用 Welogx 平台服务或网站资料的用户。
          非注册用户是指未进行注册、直接登录 Welogx 平台或通过其他网站进入 Welogx 平台直接或间接地使用 Welogx 平台服务或网站资料的用户。
        </p>
        <p style={pStyle}>
          <strong>协议方</strong>，本协议中协议双方合称"协议方"。WELOGX TECHNOLOGY INC 及其相关服务可能存在的运营关联单位、Welogx 平台在协议中统称为"Welogx"。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>二、协议的效力</h2>
        <p style={pStyle}>
          1、在您按照注册页面提示填写信息、阅读并同意本协议并完成全部注册程序后或以其他 Welogx 允许的方式实际使用 Welogx 平台服务时，您即受本协议的约束。
        </p>
        <p style={pStyle}>
          2、本协议内容包括本协议正文、《Welogx 隐私权条款》（详见 <a href="/privacy" style={{ color: '#2563eb' }}>隐私条款页面</a>），
          且您在使用 Welogx 某一特定服务时，该服务可能会另有单独的协议、相关业务规则等（以下统称为"规则"）。
          所有 Welogx 已经发布的或将来可能发布的规则为本协议不可分割的组成部分，与本协议具有同等法律效力。
          如果您不同意本协议的约定，您应立即停止注册程序或停止使用 Welogx 平台服务。
        </p>
        <p style={pStyle}>
          3、Welogx 有权根据国家法律法规的更新、产品和服务规则的调整需要不时地制订、修改本协议及/或各类规则，并提前以网站公示的方式进行公示。
          如您继续使用 Welogx 平台的服务，即表示您接受经修订的协议和规则。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>三、注册</h2>
        <p style={pStyle}>
          1、您确认，在您完成注册程序或以其他 Welogx 允许的方式实际使用 Welogx 平台服务时，您应当是具备相应民事行为能力的自然人（年满18周岁）、法人或其他组织。
          若您不具备前述主体资格，Welogx 有权注销您的账户。
        </p>
        <p style={pStyle}>
          2、您应对您的用户账户、登录密码、验证码的安全，以及对通过您的账户和密码实施的行为负责。
          您的用户账户、登录密码和验证码不得以任何方式转让、借用、赠与或在第三方平台上进行展示或售卖。
        </p>
        <p style={pStyle}>
          3、Welogx 承诺非经法定原因、本协议的约定或您的事先许可，Welogx 不会向任何第三方透露您的注册账号、手机号码等非公开信息。
        </p>
        <p style={pStyle}>
          4、您在注册帐号或使用 Welogx 平台服务的过程中，应提供合法、真实、准确的个人资料，如有变动应及时更新。
          如因您提供的个人资料不合法、不真实、不准确的，您需承担因此引起的相应责任及后果，Welogx 保留终止您使用各项服务的权利。
        </p>
        <p style={pStyle}>
          5、您不得通过任何手段恶意注册 Welogx 帐号，包括但不限于以牟利、炒作等为目的注册多个账号，亦不得盗用其他用户帐号。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>四、Welogx 平台服务说明</h2>
        <p style={pStyle}>Welogx 是一个物流科技平台，为用户提供以下服务：</p>
        <ul style={ulStyle}>
          <li>货运报价服务（LTL零担、FTL整车及其他运输方式）</li>
          <li>订单管理与货物追踪</li>
          <li>物流单据生成（提单BOL、费率确认单、发票、报价单）</li>
          <li>物流设备租赁与出售信息市场</li>
          <li>物流行业招聘求职平台</li>
          <li>行业资讯社区论坛</li>
          <li>FBA仓库预约交换</li>
          <li>运费计算器与单位换算工具</li>
        </ul>
        <p style={pStyle}>
          Welogx 作为物流中介平台，连接发货人与承运人。货运报价为估价，可能根据实际货物详情进行调整；
          运输时间为预估，除非明确声明否则不予保证；货物损坏或丢失索赔受承运人责任限制及相关法规约束。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>五、平台使用规范</h2>
        <h3 style={h3Style}>1、信息发布规范</h3>
        <p style={pStyle}>通过 Welogx 平台，您可以按照规则发布各种物流相关信息。但所发布之信息不得含有如下内容：</p>
        <ul style={ulStyle}>
          <li>违反美国联邦或州法律法规的内容</li>
          <li>煽动仇恨、歧视、暴力或恐怖活动的内容</li>
          <li>捏造或歪曲事实，散布谣言，扰乱社会秩序的内容</li>
          <li>淫秽、色情、赌博、教唆犯罪的内容</li>
          <li>公然侮辱他人或捏造事实诽谤他人，或进行恶意攻击的内容</li>
          <li>侵犯他人知识产权、商业秘密或其他合法权利的内容</li>
          <li>虚假、欺诈性的货运信息或交易信息</li>
        </ul>

        <h3 style={h3Style}>2、行为规范</h3>
        <p style={pStyle}>在使用 Welogx 服务过程中，您不得从事下列行为：</p>
        <ul style={ulStyle}>
          <li>发布虚假货运信息、作弊或通过其他手段进行虚假交易</li>
          <li>使用未经许可的数据或进入未经许可的服务器/帐号</li>
          <li>企图干涉、破坏平台系统或网站的正常运行</li>
          <li>未经 Welogx 书面授权，以任何方式复制、传播、出售平台内容</li>
          <li>进行危害计算机网络安全的行为</li>
          <li>提交虚假的货物重量、尺寸或商品信息</li>
        </ul>

        <h3 style={h3Style}>3、违规处理</h3>
        <p style={pStyle}>
          您违反上述承诺时，Welogx 有权依据本协议做出相应处理或终止向您提供服务，包括但不限于直接屏蔽、删除侵权信息、降低信用值或直接停止提供服务。
          如因此使 Welogx 遭受损失，您应当赔偿 Welogx 因此造成的损失及发生的费用，包括合理的律师费用。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>六、付款条款</h2>
        <ul style={ulStyle}>
          <li>付款条款以个别发票中注明的为准（通常为 Net 30 或收到即付）</li>
          <li>逾期付款可能需支付滞纳金</li>
          <li>我们接受支票、ACH、Zelle 及电汇付款</li>
          <li>所有价格均以美元（USD）计价，除非另有说明</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>七、责任范围和责任限制</h2>
        <p style={pStyle}>
          1、Welogx 负责向您提供平台服务，但对平台服务不作任何明示或暗示的保证，包括但不限于适用性、无错误或疏漏、持续性、准确性、可靠性。
        </p>
        <p style={pStyle}>
          2、Welogx 仅向您提供平台服务，平台上的信息系用户自行发布。由于海量信息的存在，平台无法杜绝可能存在的风险和瑕疵。
          您应谨慎判断确定相关信息的真实性、合法性和有效性。
        </p>
        <p style={boldPStyle}>
          3、在法律允许的最大范围内，WELOGX TECHNOLOGY INC 不对任何间接的、偶然的、特殊的、后果性的或惩罚性的损害承担赔偿责任，
          包括但不限于利润损失、数据丢失或商业机会损失。
        </p>
        <p style={pStyle}>
          4、Welogx 对下列不可抗力行为免责：信息网络设备维护、网络连接故障、电脑或通讯系统故障、电力故障、罢工、暴乱、
          火灾、洪水、风暴、爆炸、战争、政府行为、司法行政机关的命令或第三方的不作为。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>八、知识产权声明</h2>
        <p style={pStyle}>
          1、Welogx 所在公司及其关联公司的商标、标识、页面风格、编排方式、程序等，受法律保护，任何人不得擅自使用。
        </p>
        <p style={pStyle}>
          2、Welogx 平台所刊登的资料信息（包括但不限于文字、图表、标识、图像、软件等），均是 Welogx 或其内容提供者的财产，
          受美国和国际版权法的保护。未经 Welogx 明确书面许可，任何第三方不得以任何方式复制、传播、使用平台内容。
        </p>
        <p style={pStyle}>
          3、用户通过 Welogx 平台发布的信息，授予 Welogx 非独占的、全球性的、免版税的许可，可在与服务相关的范围内使用、展示和分发该内容。
        </p>
        <p style={pStyle}>
          4、用户通过 Welogx 平台发布的信息或内容，并不代表 Welogx 之意见及观点，也不意味着 Welogx 赞同其观点或证实其内容的真实性。
          Welogx 有权删除网站内不符合法律或本协议规定的信息或内容。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>九、赔偿</h2>
        <p style={pStyle}>
          您同意赔偿并使 WELOGX TECHNOLOGY INC 及其管理人员、董事、员工和代理人免受因您使用本服务或违反本条款而产生的任何索赔、损害或费用。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>十、协议终止</h2>
        <p style={pStyle}>
          1、Welogx 基于平台服务安全性，有权中止或终止向您提供部分或全部服务，暂时冻结或永久注销您的帐户。
        </p>
        <p style={pStyle}>
          2、如您对本协议的修改有异议，或对 Welogx 的服务不满，您可以停止使用 Welogx 服务，或通过客服渠道告知 Welogx 停止服务。
        </p>
        <p style={pStyle}>
          3、协议终止后，Welogx 仍有权继续保存您的注册信息及发布记录至法律规定的保存期满，并可就您在使用期间的违法或违约行为追究责任。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>十一、隐私权政策</h2>
        <p style={pStyle}>
          1、Welogx 在平台公布并不时修订隐私权条款，隐私权条款构成本协议的有效组成部分。详见
          《<a href="/privacy" style={{ color: '#2563eb' }}>Welogx 隐私权条款</a>》。
        </p>
        <p style={pStyle}>
          2、您知悉并承诺在使用 Welogx 服务过程中遵守隐私权条款。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>十二、法律适用、管辖与其他</h2>
        <p style={pStyle}>
          1、本协议之订立、生效、解释、修订、补充、终止、执行与争议解决均适用美国法律。如法律无相关规定的，则应参照通用国际商业惯例和/或行业惯例。
        </p>
        <p style={pStyle}>
          2、本协议任一条款被视为废止、无效或不可执行，该条应视为可分的且并不影响本协议其余条款的有效性及可执行性。
        </p>
        <p style={pStyle}>
          3、因本协议产生之争议、纠纷，应由 Welogx 与您友好协商解决；协商不成的，应提交美国纽约州萨福克县法院管辖。
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>十三、联系我们</h2>
        <p style={pStyle}>如您对本协议有任何疑问，请通过以下方式联系我们：</p>
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

export default TermsOfService;
