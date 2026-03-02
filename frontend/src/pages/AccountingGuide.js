import React from 'react';

const s = { marginBottom: 28 };
const h2 = { fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 10, borderBottom: '2px solid #1565C0', paddingBottom: 6 };
const h3 = { fontSize: 15, fontWeight: 600, color: '#1565C0', marginBottom: 8 };
const p = { fontSize: 14, lineHeight: 1.8, color: '#374151', margin: '0 0 10px' };
const ol = { paddingLeft: 20, margin: '8px 0', fontSize: 14, lineHeight: 2, color: '#374151' };
const tip = { padding: '10px 14px', background: '#eff6ff', borderLeft: '3px solid #1565C0', borderRadius: 4, fontSize: 13, color: '#1e40af', marginBottom: 12 };

const AccountingGuide = () => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
    <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
      Accounting Operations Guide / 会计操作指南
    </h1>
    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>
      WELOGX TECHNOLOGY INC - QuickBooks Online Integration
    </p>

    {/* Section 1: Overview */}
    <div style={s}>
      <h2 style={h2}>1. System Overview / 系统概览</h2>
      <p style={p}>
        Welogx integrates with QuickBooks Online (QBO) to streamline invoice and payment management.
        When employees generate an invoice in Welogx, it can be synced to QBO with one click.
      </p>
      <p style={p}>
        Welogx 系统与 QuickBooks Online (QBO) 集成，简化发票和付款管理流程。
        员工在 Welogx 生成发票后，可以一键同步到 QBO。
      </p>
      <div style={tip}>
        The sync is one-directional for invoices (Welogx → QBO) and reverse for payments (QBO → Welogx).
        <br />
        发票同步方向：Welogx → QBO。付款状态同步方向：QBO → Welogx。
      </div>
    </div>

    {/* Section 2: Daily Workflow */}
    <div style={s}>
      <h2 style={h2}>2. Daily Workflow / 日常工作流程</h2>

      <h3 style={h3}>Step 1: Employee generates invoice / 员工生成发票</h3>
      <ol style={ol}>
        <li>Employee goes to the Orders page, selects completed orders / 员工进入订单页面，选择已完成的订单</li>
        <li>Clicks "Invoice" to generate an Excel invoice / 点击 "Invoice" 生成 Excel 发票</li>
        <li>Clicks "Sync to QuickBooks Online" / 点击 "同步到 QuickBooks Online"</li>
        <li>Invoice appears in QBO automatically with customer info and line items / 发票自动出现在 QBO 中，包含客户信息和明细</li>
      </ol>

      <h3 style={h3}>Step 2: Accountant reviews and sends invoice / 会计审核并发送发票</h3>
      <ol style={ol}>
        <li>Log in to QuickBooks Online at <strong>qbo.intuit.com</strong> / 登录 QBO</li>
        <li>Go to <strong>Sales → Invoices</strong> / 进入 Sales → Invoices</li>
        <li>Find the new invoice (DocNumber matches the INV-XXXX number) / 找到新发票</li>
        <li>Review the amounts and line items / 检查金额和明细</li>
        <li>Click <strong>"Send"</strong> to email the invoice to the customer / 点击 "Send" 发送给客户</li>
      </ol>
      <div style={tip}>
        If the customer's email is set in Welogx, it will be pre-filled in QBO. Otherwise, enter it manually.
        <br />
        如果客户邮箱已在 Welogx 设置，QBO 中会自动填入。否则需要手动输入。
      </div>

      <h3 style={h3}>Step 3: Record payment / 记录收款</h3>
      <ol style={ol}>
        <li>When the customer pays (check, ACH, Zelle, wire), go to QBO / 客户付款后，进入 QBO</li>
        <li>Find the invoice under <strong>Sales → Invoices</strong> / 找到对应发票</li>
        <li>Click <strong>"Receive Payment"</strong> / 点击 "Receive Payment"</li>
        <li>Enter the payment amount, date, and method / 输入付款金额、日期和方式</li>
        <li>Click <strong>"Save and close"</strong> / 点击 "保存"</li>
      </ol>

      <h3 style={h3}>Step 4: Sync payment status back / 同步付款状态回 Welogx</h3>
      <ol style={ol}>
        <li>In Welogx, go to the Orders page / 在 Welogx 订单页面</li>
        <li>Click <strong>"QuickBooks"</strong> in the sidebar / 点击左侧 "QuickBooks"</li>
        <li>Click <strong>"同步付款状态"</strong> (Sync Payment Status) / 点击同步按钮</li>
        <li>The system will check QBO and update all invoices that have been paid / 系统会检查 QBO 并更新所有已付款的发票</li>
      </ol>
    </div>

    {/* Section 3: Weekly Tasks */}
    <div style={s}>
      <h2 style={h2}>3. Weekly Tasks / 每周任务</h2>
      <ol style={ol}>
        <li><strong>Reconcile bank transactions / 银行对账</strong>: In QBO, go to Banking → match transactions with invoices / 在 QBO 中进入 Banking，匹配银行流水和发票</li>
        <li><strong>Check overdue invoices / 检查逾期发票</strong>: In Welogx, click "检查逾期" in the sidebar / 在 Welogx 点击 "检查逾期"</li>
        <li><strong>Sync payment status / 同步付款状态</strong>: Click "同步付款状态" to update all records / 点击同步按钮更新所有记录</li>
        <li><strong>Review Profit & Loss / 查看损益表</strong>: In QBO, go to Reports → Profit and Loss / 在 QBO 中查看损益表</li>
      </ol>
    </div>

    {/* Section 4: Important Notes */}
    <div style={s}>
      <h2 style={h2}>4. Important Notes / 重要提示</h2>
      <ul style={{ ...ol, listStyleType: 'disc' }}>
        <li>Do NOT delete invoices in QBO that were synced from Welogx / 不要在 QBO 中删除从 Welogx 同步的发票</li>
        <li>Do NOT change the DocNumber (INV-XXXX) in QBO -- it links to Welogx / 不要修改 QBO 中的发票编号</li>
        <li>If you need to issue a refund or credit, do it in QBO using "Credit Memo" / 如需退款，在 QBO 中使用 Credit Memo</li>
        <li>The QBO connection token refreshes automatically, but if it expires (after 100 days of inactivity), reconnect from the QuickBooks settings panel / QBO 连接会自动刷新，但如果超过100天未使用需要重新连接</li>
      </ul>
    </div>

    {/* Section 5: Troubleshooting */}
    <div style={s}>
      <h2 style={h2}>5. Troubleshooting / 常见问题</h2>

      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 14, color: '#111827' }}>Q: Invoice not appearing in QBO / 发票没出现在 QBO</strong>
        <p style={p}>A: Check the QuickBooks connection status in the sidebar. If disconnected, reconnect. Then re-sync the invoice. / 检查左侧 QuickBooks 连接状态。如果断开了就重连，然后重新同步发票。</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 14, color: '#111827' }}>Q: Payment status not updating / 付款状态没更新</strong>
        <p style={p}>A: Click "同步付款状态" in the QuickBooks settings panel. Make sure the payment was recorded in QBO first. / 点击同步按钮。确保先在 QBO 中记录了付款。</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 14, color: '#111827' }}>Q: Customer email not showing in QBO invoice / 客户邮箱没显示</strong>
        <p style={p}>A: Make sure the customer has an email address in Welogx (Customers page). The email is synced when the invoice is created. / 确保在 Welogx 客户管理页面中填写了客户邮箱。</p>
      </div>
    </div>

    {/* Footer */}
    <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: 12 }}>
      WELOGX TECHNOLOGY INC | www.welogx.com | 55 Kennedy Dr, Hauppauge, NY 11788
    </div>
  </div>
);

export default AccountingGuide;
