# DAT Load Board Integration — Certification Package

## Part 1: Integration Overview (send to DAT before demo)

### Application Description

**Welogx** (welogx.com) is a web-based Transportation Management System (TMS) and freight brokerage platform serving the US domestic freight market. The application enables brokers and freight agents to manage orders, obtain carrier quotes, and coordinate shipments.

### DAT Products and Services Used

| DAT API | Purpose |
|---------|---------|
| **Freight Posting API v2** | Post, update, refresh, and delete loads and trucks on the DAT load board |
| **Freight Search API v2** | Search for available loads and trucks on the DAT load board |
| **RateView API v2** | Lane-based spot and contract rate lookups for pricing intelligence |
| **Access Token API** | Two-step JWT authentication (org token + per-user token) |

### API Calls Used

| Method | Endpoint | Function |
|--------|----------|----------|
| POST | /v1/token/organization | Get organizational access token |
| POST | /v1/token/user | Get individual user access token |
| POST | /v2/loads | Create a new load post |
| PUT | /v2/loads/{id} | Update an existing load post |
| POST | /v2/loads/{id}/refresh | Refresh a load post |
| DELETE | /v2/loads/{id} | Delete a load post |
| POST | /v2/trucks | Create a new truck post |
| PUT | /v2/trucks/{id} | Update an existing truck post |
| POST | /v2/trucks/{id}/refresh | Refresh a truck post |
| DELETE | /v2/trucks/{id} | Delete a truck post |
| POST | /search/v2/loads | Search loads |
| POST | /search/v2/trucks | Search trucks |
| POST | /analytics/rateview/v2/rates | Rate lookup |

### How the Integration Works

1. **Authentication**: Each employee has a unique DAT email stored in the system. The app obtains an org-level token using the Service Account, then a per-user token for the individual employee. Tokens are cached and auto-refreshed (30-min expiry).

2. **Posting**: Employees post loads/trucks to DAT directly from the Welogx UI. Each post is tracked locally (dat_posts table) with the DAT post ID, so it can be updated, refreshed, or deleted without creating duplicates.

3. **Searching**: Employees search the DAT load board in real-time. All searches are initiated by human users — no auto-generated or scheduled searches. Results are attributed to DAT with a visible "Powered by DAT" badge.

4. **Order Matching**: When a load is matched (order confirmed in the TMS), the associated DAT post is automatically deleted via the API and marked as "matched" locally.

5. **Rate Intelligence**: DAT RateView rates are displayed alongside carrier quotes to help brokers make informed pricing decisions.

---

## Part 2: Certification Requirements Checklist

| # | Requirement | Status | Implementation |
|---|------------|--------|----------------|
| 1 | **Individual Access** | DONE | Per-user DAT emails in users table; per-user token cache (Map keyed by email); no credential sharing |
| 2 | **Create new posts** | DONE | POST /v2/loads and /v2/trucks; proper payload structure (freight, lane, exposure) |
| 3 | **Update posts** | DONE | PUT /v2/loads/{id} and /v2/trucks/{id}; tracks changes locally |
| 4 | **Refresh posts** | DONE | POST /v2/loads/{id}/refresh; single-post refresh only; no delete+recreate |
| 5 | **Delete posts** | DONE | DELETE /v2/loads/{id}; individual deletion only; no bulk delete |
| 6 | **Search** | DONE | POST /search/v2/loads and /search/v2/trucks; real-time user-initiated only |
| 7 | **Search/post reciprocity** | DONE | Same UI supports both search and full CRUD posting |
| 8 | **Attribution to DAT** | DONE | "Powered by DAT" badge on search results (banner) and all DAT-sourced data |
| 9 | **Equipment types** | DONE | Full official enum (80+ types: V, R, F, VR, SD, RG, AC, etc.) |
| 10 | **Delete matched posts** | DONE | Auto-delete on order confirmation; status changes to "matched" |
| 11 | **No bulk deletion & re-post** | DONE | Refresh endpoint used; no bulk operations |
| 12 | **No large volume storage** | DONE | Search results are displayed, not stored |
| 13 | **No auto-generated searches** | DONE | All searches triggered by manual user action only |

---

## Part 3: Demo Script (step-by-step for certification call)

### Setup
- Open https://welogx.com in browser
- Log in with Employee Account A (has dat_email configured)
- Navigate to: Employee System > DAT Load Board

### Demo Step 1: Create Load Post
1. Click "Post to DAT" tab
2. Select "Post Load"
3. Fill in:
   - Origin Zip: 60601 (Chicago, IL)
   - Destination Zip: 90001 (Los Angeles, CA)
   - Equipment Type: V - Van
   - Pickup Date: tomorrow
   - Weight: 40000
   - Rate: 3500
   - Commodity: General Freight
4. Click "Post Load to DAT"
5. **Show**: Success message, post appears in "My DAT Posts" tab

### Demo Step 2: Create Truck Post
1. Click "Post Truck" toggle
2. Fill in:
   - Current Location Zip: 33101 (Miami, FL)
   - Preferred Destination Zip: 30301 (Atlanta, GA)
   - Equipment Type: R - Reefer
   - Available Date: tomorrow
   - Capacity: 44000
3. Click "Post Truck to DAT"

### Demo Step 3: Update Post
1. Go to "My DAT Posts" tab
2. (Need update UI or use API directly to show PUT /v2/loads/{id})
3. Change destination to 85001 (Phoenix, AZ)
4. **Show**: Post updated, DAT post ID retained

### Demo Step 4: Refresh Post
1. In "My DAT Posts", click the refresh icon on the load post
2. **Show**: "Last Refreshed" timestamp updates
3. **Explain**: Uses POST /v2/loads/{id}/refresh — does not delete and recreate

### Demo Step 5: Search Loads
1. Click "Search DAT" tab
2. Select "Loads"
3. Enter: Origin Zip: 60601, Radius: 100
4. Click "Search Loads"
5. **Show**: Results table with "Powered by DAT" attribution banner
6. **Explain**: No results stored; real-time user-initiated search only

### Demo Step 6: Search Trucks
1. Switch to "Trucks" toggle
2. Enter: Origin Zip: 90001
3. Click "Search Trucks"
4. **Show**: Truck results with DAT attribution

### Demo Step 7: Delete Post
1. Go to "My DAT Posts"
2. Click trash icon on the truck post
3. Confirm deletion
4. **Show**: Post status changes to "deleted"
5. **Explain**: Individual deletion only, never bulk delete

### Demo Step 8: Delete Matched Post (Auto)
1. Navigate to Employee System > Orders (broker order list)
2. Open an order that has a DAT post linked to it
3. Click "Confirm Order" (changes status from quote to confirmed)
4. **Show**: The linked DAT post is automatically deleted and marked "matched"
5. **Explain**: This happens server-side whenever an order is confirmed

### Demo Step 9: Individual Access
1. **Show**: Employee settings with dat_email field
2. **Explain**: Each employee has their own DAT email; tokens are cached per-user
3. **(If possible)**: Log in as Employee B, show they get their own token
4. **Show code**: Per-user token Map in datService.js

### Demo Step 10: Equipment Types
1. **Show**: Equipment type dropdown with full official DAT enum
2. **Explain**: Codes match DAT spec exactly (V, R, F, SD, RG, etc.)

---

## Part 4: Pre-Certification Testing Plan

Before scheduling the demo, run in nprod environment (DAT_API_ENV=nprod):

| Function | Min Tests | API Call |
|----------|-----------|----------|
| Create Load Post | 30 | POST /v2/loads |
| Update Load Post | 30 | PUT /v2/loads/{id} |
| Refresh Load Post | 30 | POST /v2/loads/{id}/refresh |
| Delete Load Post | 30 | DELETE /v2/loads/{id} |
| Create Truck Post | 30 | POST /v2/trucks |
| Update Truck Post | 30 | PUT /v2/trucks/{id} |
| Refresh Truck Post | 30 | POST /v2/trucks/{id}/refresh |
| Delete Truck Post | 30 | DELETE /v2/trucks/{id} |
| Search Loads | 30 | POST /search/v2/loads |
| Search Trucks | 30 | POST /search/v2/trucks |

After testing, provide projected load percentage to DAT Customer Support.

---

## Part 5: Contact Information

- **Certification scheduling**: techsupportteamleads@dat.com
- **Developer support**: developersupport@dat.com
- **Our application**: https://welogx.com
- **DAT Load Board page**: https://welogx.com/employee/dat-loadboard
