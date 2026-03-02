import React from 'react';

const sectionStyle = { marginBottom: 28 };
const h2Style = { fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 10 };
const pStyle = { fontSize: 14, lineHeight: 1.8, color: '#374151', margin: '0 0 10px' };
const ulStyle = { paddingLeft: 20, margin: '8px 0', fontSize: 14, lineHeight: 2, color: '#374151' };

const TermsOfService = () => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Terms of Service</h1>
    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>Last updated: February 20, 2026</p>

    <div style={sectionStyle}>
      <p style={pStyle}>
        Welcome to Welogx. These Terms of Service ("Terms") govern your use of the website
        https://welogx.com and related services (the "Service") operated by WELOGX TECHNOLOGY INC
        ("Welogx", "we", "us", or "our"). By accessing or using the Service, you agree to be
        bound by these Terms.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>1. Acceptance of Terms</h2>
      <p style={pStyle}>
        By creating an account or using any part of the Service, you acknowledge that you have read,
        understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree,
        you may not use the Service.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>2. Description of Service</h2>
      <p style={pStyle}>
        Welogx is a logistics technology platform that provides:
      </p>
      <ul style={ulStyle}>
        <li>Freight shipping quotes (LTL, FTL, and other modes)</li>
        <li>Order management and shipment tracking</li>
        <li>Document generation (BOL, Rate Confirmation, Invoices, Quotations)</li>
        <li>Logistics industry directory and community forum</li>
        <li>Freight calculator and conversion tools</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>3. User Accounts</h2>
      <ul style={ulStyle}>
        <li>You must provide accurate and complete information when creating an account.</li>
        <li>You are responsible for maintaining the security of your account credentials.</li>
        <li>You must notify us immediately of any unauthorized use of your account.</li>
        <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>4. Shipping and Freight Services</h2>
      <p style={pStyle}>
        Welogx acts as a logistics intermediary connecting shippers with freight carriers. While we
        strive to provide accurate quotes and reliable service:
      </p>
      <ul style={ulStyle}>
        <li>Freight rates are estimates and may be subject to adjustment based on actual shipment details.</li>
        <li>Transit times are estimates and not guaranteed unless explicitly stated.</li>
        <li>Claims for damaged or lost freight are subject to carrier liability limits and applicable regulations.</li>
        <li>Users are responsible for providing accurate shipment information including weight, dimensions, and commodity details.</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>5. Payment Terms</h2>
      <ul style={ulStyle}>
        <li>Payment terms are as specified in individual invoices (typically Net 30 or Due on Receipt).</li>
        <li>Late payments may be subject to late fees as agreed upon with the customer.</li>
        <li>We accept payment via check, ACH, Zelle, and wire transfer.</li>
        <li>All prices are in US Dollars (USD) unless otherwise stated.</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>6. Intellectual Property</h2>
      <p style={pStyle}>
        The Service and its original content, features, and functionality are owned by
        WELOGX TECHNOLOGY INC and are protected by international copyright, trademark,
        and other intellectual property laws. You may not reproduce, distribute, or create
        derivative works without our express written permission.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>7. Prohibited Conduct</h2>
      <p style={pStyle}>You agree not to:</p>
      <ul style={ulStyle}>
        <li>Use the Service for any unlawful purpose or to ship prohibited items</li>
        <li>Interfere with or disrupt the Service or servers</li>
        <li>Attempt to gain unauthorized access to any part of the Service</li>
        <li>Submit false or misleading shipment information</li>
        <li>Scrape, data-mine, or use automated means to access the Service without permission</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>8. Limitation of Liability</h2>
      <p style={pStyle}>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WELOGX TECHNOLOGY INC SHALL NOT BE LIABLE FOR
        ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT
        NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR
        RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT
        PAID BY YOU TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
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
      <h2 style={h2Style}>10. Governing Law</h2>
      <p style={pStyle}>
        These Terms shall be governed by and construed in accordance with the laws of the
        State of New York, United States, without regard to its conflict of law provisions.
        Any disputes shall be resolved in the courts located in Suffolk County, New York.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>11. Changes to Terms</h2>
      <p style={pStyle}>
        We reserve the right to modify these Terms at any time. We will provide notice of
        significant changes by posting the updated Terms on this page. Your continued use of
        the Service after changes constitutes acceptance of the new Terms.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={h2Style}>12. Contact Us</h2>
      <p style={pStyle}>
        If you have any questions about these Terms of Service, please contact us:
      </p>
      <ul style={ulStyle}>
        <li>Email: ftl.us48@gmail.com</li>
        <li>Address: 55 Kennedy Dr, Hauppauge, NY 11788</li>
        <li>Website: https://welogx.com</li>
      </ul>
    </div>
  </div>
);

export default TermsOfService;
