---
name: AI LTL Automation Revised
overview: "Revised AI automation plan for EW Logistics LTL brokerage. Focuses on practical, token-efficient implementation: code handles structure, AI only handles what code can't. Addresses WeCom limitations, DAT API access, token budget, and builds on what's already deployed."
todos:
  - id: phase2-carrier-discount
    content: "Phase 2a: 排查 9 家 carrier API 的 account/discount 配置，修复报价不准确问题"
    status: pending
  - id: phase2-dat-setup
    content: "Phase 2b: 申请 DAT Connexion API 权限，配置 OAuth credentials，对接 datService.js"
    status: pending
  - id: phase2-auto-pricing
    content: "Phase 2c: 建单后自动查价 + 推荐定价算法（纯代码，零 AI token）"
    status: pending
  - id: phase4-email-templates
    content: "Phase 4a: 邮件模板系统 — Quote/BOL/RC/Invoice/POD 模板 + mailto/Gmail API 自动打开"
    status: pending
  - id: phase4-status-notify
    content: "Phase 4b: 订单状态变更通知 — 网站内通知 + 邮件推送给 Sales/客户/司机"
    status: pending
  - id: phase3-driver-match-api
    content: "Phase 3a: 智能司机匹配 API — 代码查历史同路线订单，推荐司机列表"
    status: pending
  - id: phase3-ai-agent-chat
    content: "Phase 3b: 内嵌 AI Agent 对话 — Gemini function calling，自然语言查司机/订单"
    status: pending
  - id: phase5-tracking
    content: "Phase 5: Traccar 自部署 GPS 追踪 或 MacroPoint API 集成"
    status: pending
isProject: false
---

# AI 驱动 LTL 自动化方案（修订版）

## 核心原则：代码能做的不用 AI，AI 只做代码做不了的

Gemini 2.5 Flash 价格：输入 $0.30/百万token，输出 $2.50/百万token。
一次文件解析约用 5K-15K tokens ≈ $0.01-0.04。每月 1000 单 ≈ **$10-40/月**。
关键是：**结构化操作用代码，非结构化理解用 AI**。

---

## Phase 1: 文件解析（已基本完成，微调即可）

**WeCom 限制**: 美国公司无法操作外部客户群（需中国备案）。
**当前方案已经是最优**: 员工从微信收到文件 → 拖拽到 BrokerOrdersNew 的 AIFileDropZone → Gemini 解析 → 人工审核 → 创建报价单。

**还需要微调的**:

- LTL carrier 报价折扣问题：需要检查各 carrier API 的 discount/account 配置
- 目前已有的 carrier 路由中，检查是否传入了正确的 account number 和 discount tier

**代码 vs AI 分工**:

- AI 负责：解析非结构化文件（PDF/图片/各种格式Excel）→ 输出 JSON
- 代码负责：单位转换验证、NMFC计算验证、建单、调 carrier API

---

## Phase 2: DAT + Carrier 报价准确性

### DAT 连接方式

DAT 使用 **OAuth + Client Credentials** 认证，不是简单 API key。
你的后端已有 [datService.js](backend/src/services/datService.js) 完整实现（OAuth token、rate lookup、batch lookup）。

**你需要做的**:

1. 在 DAT Developer Portal (developer.dat.com) 注册账号
2. 申请 DAT Connexion API 访问权限（联系 [developersupport@dat.com](mailto:developersupport@dat.com)）
3. 获取 `DAT_CLIENT_ID`、`DAT_CLIENT_SECRET`、`DAT_USERNAME`、`DAT_PASSWORD`
4. 配置到 ECS 环境变量

**费用**: 约 $0.04/次查询，$0.52/次历史查询。每月 1000 次 ≈ $40-520

**注意**: DAT 有限制：60次搜索/小时，1000次/用户/月

### Carrier 报价不准确排查

需要检查 9 家 carrier 路由中的 account number 和 discount tier 配置：

- [warp.js](backend/src/routes/warp.js) — Warp API key/account
- [rrts.js](backend/src/routes/rrts.js) — RRTS account number
- [rlc.js](backend/src/routes/rlc.js) — R+L account/discount
- [saia.js](backend/src/routes/saia.js) — Saia account
- [tforce.js](backend/src/routes/tforce.js) — TForce account
- 其他 carrier 同理

每家 carrier 的报价 API 通常需要你们的 **签约账号** 才能拿到折扣价，否则返回的是公开零售价（list rate），会比实际高 30-60%。

### 智能定价建议（代码实现，不需 AI token）

建单后自动触发（纯代码逻辑）：

1. 查 DAT spot rate → 填入 `total_dat`
2. 查 9 家 carrier → 取最低价填入参考
3. 查历史同路线订单 → 取平均利润率
4. 计算推荐价：`max(DAT_rate, lowest_carrier) × (1 + avg_margin)`
5. 在 BrokerOrdersNew 显示：DAT | Carrier 最低 | AI 推荐 | 历史均价

**这部分完全用代码实现，零 AI token 消耗。**

---

## Phase 3: 智能司机匹配 — 数据库 AI Agent

### 方案：MCP (Model Context Protocol) + Cursor

你的 Mac Mini 上装了 OpenClaw，可以配置 MCP 连接 PostgreSQL：

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres",
        "postgresql://ai_readonly:password@ew-logistics-db...rds.amazonaws.com:5432/ewlogistics"]
    }
  }
}
```

这样在 Cursor 或 OpenClaw 中可以直接用自然语言查数据库。

### 网站内嵌 AI Agent（给员工日常使用）

**Token 节省策略**:

- **不要**每次对话都发整个数据库 schema 给 AI
- **提前用代码**做好常用查询的 API endpoint（零 token）：
  - `GET /api/agent/match-drivers?origin_zip=91744&dest_zip=33032` — 代码查历史订单
  - `GET /api/agent/lane-history?origin=CA&dest=FL` — 代码查同路线历史
  - `GET /api/agent/driver-stats?mc=1234567` — 代码查司机统计
- **AI 只在需要自然语言理解时调用**：
  - 员工问"帮我找上次跑过 LA 到 Miami 的那个姓 Wang 的司机" → AI 理解意图 → 调用代码 API
  - 每次对话约 1K-3K tokens ≈ $0.001-0.008

**实现方式**: Gemini function calling

- 定义 5-10 个工具函数（查司机、查历史、查路线等）
- AI 只负责理解员工的自然语言 → 选择调用哪个函数 → 格式化返回结果
- 实际数据查询全部由后端代码执行

**预估 token 消耗**: 每天 50 次对话 × 2K tokens = 100K tokens/天 ≈ **$0.28/天 ≈ $8.4/月**

---

## Phase 4: 自动文档 + 通知

### 邮件生成（代码实现，不用 AI）

**方案**: 代码生成邮件内容 → `mailto:` 链接 → 自动打开 Gmail 预填好标题和内容

```
mailto:customer@email.com?subject=Quote%20WE84&body=Dear%20Customer...
```

或者用 Gmail API 直接发送（更自动化）。

**模板全部用代码**，不需要 AI：

- Quote 邮件模板：固定格式，变量替换（WE单号、路线、价格、有效期）
- BOL 邮件模板：附件 + 固定格式
- RC 邮件模板：给司机的，固定格式
- Invoice 邮件模板：固定格式
- POD 邮件模板：固定格式

**状态通知实现**:

- 订单状态变更时，后端触发通知
- 给客户：邮件 + （可选）短信
- 给 Sales：网站内通知（铃铛图标）+ 邮件
- 给司机：邮件 + 短信（用 AWS SNS 或 Twilio）
- 全部代码模板，**零 AI token**

---

## Phase 5: 货物追踪

### MacroPoint/FourKites

**有 API**，需要联系申请：

- MacroPoint (Descartes): carrier.macropointconnect.com — 支持 LTL carrier 集成
- FourKites: 需要 Company ID + Client ID + Secret
- 费用：按追踪次数计费，需联系获取报价

### 替代方案（更快上线）

**Traccar** — 开源 GPS 追踪系统（Apache License）:

- 自部署在你的 Mac Mini 上
- REST API + WebSocket 实时更新
- 支持各种 GPS 设备和手机 APP
- **完全免费**
- 司机用手机 APP 共享位置 → 你的系统实时显示

**ELD 集成**: 很多司机已经有 ELD（KeepTruckin/Motive, Samsara 等），这些平台有 API 可以拉取位置数据。

**推荐路径**: 先用 Traccar（免费），后续再对接 MacroPoint（付费但更全面）。

---

## Phase 6: Token 预算和 AI vs 代码分工

### 完整的 AI vs 代码分工表


| 功能                 | 用代码（零token）                   | 用AI（消耗token）              |
| ------------------ | ----------------------------- | ------------------------- |
| 文件解析（PDF/图片）       | 不行                            | **Gemini** ~$0.02/次       |
| Excel 解析           | xlsx 提取文本                     | **Gemini** 理解内容 ~$0.01/次  |
| 单位转换 kg→lbs, cm→in | **代码**                        | 不需要                       |
| NMFC 分类计算          | **代码**                        | 不需要                       |
| 托盘化计算              | AI 初算 + **代码验证**              | 已含在文件解析中                  |
| 查 DAT 费率           | **代码** API 调用                 | 不需要                       |
| 查 carrier 报价       | **代码** 9家 API                 | 不需要                       |
| 利润计算/推荐定价          | **代码** 查历史+算法                 | 不需要                       |
| 匹配历史司机             | **代码** SQL 查询                 | 不需要                       |
| 自然语言搜司机            | 代码执行查询                        | **Gemini** 理解意图 ~$0.003/次 |
| 生成邮件内容             | **代码** 模板替换                   | 不需要                       |
| 生成 BOL/RC/Invoice  | **代码** Excel 模板               | 不需要                       |
| 状态通知               | **代码** 触发器                    | 不需要                       |
| GPS 追踪             | **代码** Traccar/MacroPoint API | 不需要                       |


### 月度 Token 预算估算（1000 单/月）


| 用途        | 调用次数         | tokens/次 | 月费用      |
| --------- | ------------ | -------- | -------- |
| 文件解析      | 200 次（每次含多单） | 15K      | ~$8      |
| AI 司机搜索   | 1500 次       | 2K       | ~$8      |
| 预留 buffer | —            | —        | ~$4      |
| **月总计**   | —            | —        | **~$20** |


这比雇一个报价员工（$3000+/月）便宜 150 倍。

---

## 建议开发顺序

1. **Phase 2 优先** — 排查 carrier discount 问题 + 配置 DAT → 让报价准确
2. **Phase 4 次之** — 邮件模板 + 状态通知 → 消除大量重复操作
3. **Phase 3** — 司机匹配 API + AI agent → 帮 Sales 更高效
4. **Phase 5** — Traccar 追踪 → 提升服务质量
5. **Phase 6** — 持续优化 token 使用，根据实际使用数据调整 AI vs 代码比例

