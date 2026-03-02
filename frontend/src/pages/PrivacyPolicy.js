import React from 'react';

const sectionStyle = { marginBottom: 28 };
const h2Style = { fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 10 };
const pStyle = { fontSize: 14, lineHeight: 1.8, color: '#374151', margin: '0 0 10px' };
const ulStyle = { paddingLeft: 20, margin: '8px 0', fontSize: 14, lineHeight: 2, color: '#374151' };

const PrivacyPolicy = () => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Privacy Policy</h1>
    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>Last updated: February 20, 2026</p>

    <div style={sectionStyle}>
      <p style={pStyle}>
        WELOGX TECHNOLOGY INC ("Welogx", "we", "us", or "our") operates the website
        https://welogx.com (the "Service"). This page informs you of our policies regarding
        the collection, use, and disclosure of personal data when you use our Service and the
        choices you have associated with that data.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>1. Information We Collect</h2>
      <p style={pStyle}>We collect several types of information for various purposes:</p>
      <ul style={ulStyle}>
        <li><strong>Personal Data:</strong> Name, email address, phone number, company name, and shipping addresses provided during registration or when requesting quotes.</li>
        <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time spent, and other diagnostic data collected automatically.</li>
        <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to track activity and hold certain information.</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>2. How We Use Your Information</h2>
      <ul style={ulStyle}>
        <li>To provide, maintain, and improve our logistics platform and services</li>
        <li>To process freight quotes, orders, and shipment tracking</li>
        <li>To communicate with you about your account, orders, and customer support</li>
        <li>To send promotional communications (with your consent)</li>
        <li>To detect, prevent, and address technical issues and fraud</li>
        <li>To comply with legal obligations</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>3. Data Sharing</h2>
      <p style={pStyle}>
        We do not sell your personal information. We may share data with:
      </p>
      <ul style={ulStyle}>
        <li><strong>Service Providers:</strong> Third-party companies that assist in operating our platform (e.g., AWS for hosting, payment processors, freight carriers).</li>
        <li><strong>Business Partners:</strong> Freight carriers and logistics providers necessary to fulfill your shipment orders.</li>
        <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process.</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>4. Data Security</h2>
      <p style={pStyle}>
        We implement industry-standard security measures including encryption (SSL/TLS),
        secure authentication (AWS Cognito), and access controls to protect your data.
        However, no method of transmission over the Internet is 100% secure.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>5. Data Retention</h2>
      <p style={pStyle}>
        We retain your personal data only for as long as necessary for the purposes set out
        in this policy. Order and shipment records may be retained for up to 7 years for
        accounting and legal compliance purposes.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>6. Your Rights</h2>
      <p style={pStyle}>You have the right to:</p>
      <ul style={ulStyle}>
        <li>Access, update, or delete your personal information</li>
        <li>Opt out of marketing communications</li>
        <li>Request a copy of your data</li>
        <li>Withdraw consent at any time</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>7. Third-Party Services</h2>
      <p style={pStyle}>
        Our Service may integrate with third-party services such as Google Maps, Google Analytics,
        QuickBooks Online, and various freight carrier APIs. These services have their own privacy
        policies that govern their use of your information.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>8. Children's Privacy</h2>
      <p style={pStyle}>
        Our Service is not directed to anyone under the age of 18. We do not knowingly collect
        personal information from children.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>9. Changes to This Policy</h2>
      <p style={pStyle}>
        We may update this Privacy Policy from time to time. We will notify you of any changes
        by posting the new policy on this page and updating the "Last updated" date.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>10. Contact Us</h2>
      <p style={pStyle}>
        If you have any questions about this Privacy Policy, please contact us:
      </p>
      <ul style={ulStyle}>
        <li>Email: ftl.us48@gmail.com</li>
        <li>Address: 55 Kennedy Dr, Hauppauge, NY 11788</li>
        <li>Website: https://welogx.com</li>
      </ul>
    </div>
  </div>
);

export default PrivacyPolicy;
