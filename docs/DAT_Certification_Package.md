# DAT Load Board Integration — Certification Package

## Part 1: Integration Overview (send to DAT before demo)

### Application Description

**Welogx** (welogx.com) is a web-based Transportation Management System (TMS) and freight brokerage platform serving the US domestic freight market. The application enables brokers and freight agents to manage orders, obtain carrier quotes, and coordinate shipments.

### DAT Products and Services Used

| DAT API | Version | Server | Purpose |
|---------|---------|--------|---------|
| **Access Token API** | 0.1.0 | identity.api.dat.com/access | Two-step JWT auth (org + per-user) |
| **Freight Posting API** | 8.5.0 | freight.api.dat.com/posting | Post, update, refresh, delete loads |
| **Truck Posting API** | 8.7.0 | freight.api.dat.com/posting | Post, update, refresh, delete trucks |
| **Search Freight Marketplaces** | 4.81.1 | freight.api.prod.dat.com | Search loads and equipment |
| **Rate Lookup API** | 1.0.0 | analytics.api.dat.com/linehaulrates | Spot and contract rate lookups |

### API Calls Used

| Method | Endpoint | Function |
|--------|----------|----------|
| POST | /access/v1/token/organization | Get org access token |
| POST | /access/v1/token/user | Get individual user token |
| POST | /posting/v2/loads | Create load post |
| PATCH | /posting/v2/loads/{id} | Update load post |
| POST | /posting/v2/loads/{id}/refresh | Refresh load post |
| DELETE | /posting/v2/loads?id={id} | Delete load post |
| POST | /posting/v2/trucks | Create truck post |
| PATCH | /posting/v2/trucks/{id} | Update truck post |
| POST | /posting/v2/trucks/{id}/refresh | Refresh truck post |
| DELETE | /posting/v2/trucks/{id} | Delete truck post |
| POST | /marketplaces/v1/loads/search | Search loads |
| POST | /marketplaces/v1/equipment/search | Search trucks/equipment |
| POST | /linehaulrates/v1/lookups | Rate lookup |

### How the Integration Works

1. **Authentication**: Each employee has a unique DAT email stored in the system. The app obtains an org-level token using the Service Account, then a per-user token for the individual employee. Tokens are cached per-user and auto-refreshed (30-min expiry).

2. **Posting**: Employees post loads/trucks to DAT directly from the Welogx UI. Each post is tracked locally (dat_posts table) with the DAT post ID, so it can be updated (PATCH), refreshed, or deleted without creating duplicates.

3. **Searching**: Employees search the DAT load board in real-time using the v4 Marketplace Search API. All searches are initiated by human users only — no auto-generated or scheduled searches. Results are attributed to DAT with a visible "Powered by DAT" badge.

4. **Order Matching**: When a load is matched (order confirmed in the TMS), the associated DAT post is automatically deleted via the API and marked as "matched" locally.

5. **Rate Intelligence**: DAT RateView rates are displayed alongside carrier quotes to help brokers make informed pricing decisions.

---

## Part 2: Certification Checklist Status

| # | Requirement | Status | How We Implement It |
|---|------------|--------|---------------------|
| 1 | Overview of Integration | DONE | This document (Part 1) |
| 2 | Individual Access | DONE | Per-user DAT emails in `users.dat_email`; per-user token Map cache; no credential sharing |
| 3 | Pre-Certification Testing | TODO | Set `DAT_API_ENV=nprod`, run 30+ tests per function |
| 4 | Certification Demonstration | TODO | Schedule after testing, see Demo Script below |
| 5 | Create new posts | DONE | `POST /posting/v2/loads` and `/posting/v2/trucks` |
| 6 | Update posts | DONE | `PATCH /posting/v2/loads/{id}` and trucks |
| 7 | Refresh posts | DONE | `POST /posting/v2/loads/{id}/refresh`; no delete+recreate |
| 8 | Delete posts | DONE | `DELETE /posting/v2/loads?id={id}`; individual only, no bulk |
| 9 | Search | DONE | `POST /marketplaces/v1/loads/search` and `/equipment/search` |
| 10 | Search/post reciprocity | DONE | Same UI page supports both search and full CRUD |
| 11 | Attribution to DAT | DONE | "Powered by DAT" banner on search results, badge in sidebar |
| 12 | Equipment types and classes | DONE | Full official enum (80+ types: V, R, F, VR, SD, RG, AC, etc.) |
| 13 | Delete matched posts | DONE | Auto-delete on order confirm; status set to "matched" |
| 14 | No bulk deletion & re-post | DONE | Refresh endpoint used; no bulk operations |
| 15 | No large volume storage | DONE | Search results displayed only, not stored |
| 16 | No auto-generated searches | DONE | All searches require manual user click |

---

## Part 3: Demo Script

### Setup
- Open https://welogx.com, log in with Employee Account
- Navigate: Employee System sidebar > **DAT Load Board**

### Step 1: Create Load Post
1. Tab: "Post to DAT" > "Post Load"
2. Fill: Origin 60601, Destination 90001, Equipment V-Van, Full Truckload
3. Pickup Date tomorrow, Weight 40000, Length 53, Commodity "General Freight"
4. Click "Post Load to DAT"
5. Show success + post appears in "My DAT Posts"

### Step 2: Create Truck Post
1. Toggle "Post Truck"
2. Fill: Location 33101, Destination 30301, Equipment R-Reefer, Available tomorrow
3. Click "Post Truck to DAT"

### Step 3: Update Post
1. "My DAT Posts" tab, select a post
2. Modify destination or equipment type
3. Show the PATCH call updates without creating a new post ID

### Step 4: Refresh Post
1. Click refresh icon on a post
2. Show "Last Refreshed" timestamp updates
3. Explain: `POST /v2/loads/{id}/refresh` — 15-min minimum interval, no delete+recreate

### Step 5: Search Loads
1. Tab: "Search DAT" > "Loads"
2. Origin 60601, Radius 100
3. Click "Search Loads"
4. Show: results with "Powered by DAT" attribution banner

### Step 6: Search Trucks/Equipment
1. Toggle "Trucks"
2. Origin 90001, search
3. Show: equipment results with DAT attribution

### Step 7: Delete Post
1. "My DAT Posts" > trash icon
2. Confirm delete
3. Status changes to "deleted"

### Step 8: Auto-delete on Order Match
1. Go to Employee System > Orders
2. Confirm an order linked to a DAT post
3. Show: linked DAT post auto-deleted, status = "matched"

### Step 9: Individual Access
1. Show: employee settings with `dat_email` field
2. Explain: each employee gets their own DAT token
3. Code: per-user token Map in `datService.js`

### Step 10: Equipment Types
1. Show: equipment dropdown with official DAT codes
2. Full/Partial selector (FTL vs Partial/LTL)
3. When Partial: show LTL detail fields (pallets, pieces, dims)

---

## Part 4: Pre-Certification Testing Plan

Run in nprod environment (`DAT_API_ENV=nprod`):

| Function | Min Tests | Endpoint |
|----------|-----------|----------|
| Create Load Post | 30 | POST /posting/v2/loads |
| Update Load Post | 30 | PATCH /posting/v2/loads/{id} |
| Refresh Load Post | 30 | POST /posting/v2/loads/{id}/refresh |
| Delete Load Post | 30 | DELETE /posting/v2/loads?id={id} |
| Create Truck Post | 30 | POST /posting/v2/trucks |
| Update Truck Post | 30 | PATCH /posting/v2/trucks/{id} |
| Refresh Truck Post | 30 | POST /posting/v2/trucks/{id}/refresh |
| Delete Truck Post | 30 | DELETE /posting/v2/trucks/{id} |
| Search Loads | 30 | POST /marketplaces/v1/loads/search |
| Search Equipment | 30 | POST /marketplaces/v1/equipment/search |

After testing, provide projected load percentage to DAT Customer Support.

---

## Part 5: Contact

| Purpose | Contact |
|---------|---------|
| Certification scheduling | techsupportteamleads@dat.com |
| Developer support | developersupport@dat.com |
| Application URL | https://welogx.com |
| DAT Load Board page | https://welogx.com/employee/dat-loadboard |
