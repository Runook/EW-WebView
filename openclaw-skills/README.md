# OpenClaw Skills - EW AI Quote Agent

These Python skills run inside OpenClaw to automate the freight quotation workflow.

## Skills

| Skill | Description |
|-------|-------------|
| `parse_shipment_file.py` | Parse Excel/PDF/CSV customer files into structured shipment data |
| `orchestrate_quote.py` | Full pipeline: parse → create orders → enrich with DAT rates |
| `distribute_quotes.py` | Send approved quotes back to customers via WeCom |

## Setup

### Environment Variables

Set these in your OpenClaw instance:

```bash
EW_API_BASE_URL=https://your-ew-webview-domain.com/api
AGENT_WEBHOOK_API_KEY=your-secret-key
EW_AUTH_TOKEN=your-jwt-token
```

### Dependencies

```bash
pip install openpyxl pdfplumber requests
```

### Testing Locally

```bash
# Parse a file and print results
python parse_shipment_file.py /path/to/客户的需求单.xlsx

# Parse and post to EW API
python parse_shipment_file.py /path/to/客户的需求单.xlsx --post

# Full pipeline
python orchestrate_quote.py /path/to/客户的需求单.xlsx

# Distribute all approved quotes
python distribute_quotes.py
```

## OpenClaw Webhook Integration

Configure OpenClaw to receive files from the WeCom route:

1. In OpenClaw, create a webhook trigger pointing to your file receiving endpoint
2. The WeCom callback (`/api/wecom/callback`) forwards files to OpenClaw's webhook
3. OpenClaw runs `orchestrate_quote.py` with the downloaded file
4. Results are posted back to `/api/agent/webhook`

## Data Flow

```
Customer WeChat → WeCom Bot → OpenClaw Webhook
  → parse_shipment_file.py (extract structured data)
  → orchestrate_quote.py (create orders + DAT rates)
  → Human Review (EW-WebView AI Quote Review page)
  → distribute_quotes.py (send quotes via WeCom)
```
