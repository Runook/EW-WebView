# DAT API Detailed Reference (Core Endpoints)

---
## Source: https://developer.dat.com/developer-portal/post-loads-and-trucks/freight-posting.md

# Freight Posting API

Version: 8.5.0

## Servers
Production: https://freight.api.dat.com/posting
Non-Production - Staging: https://freight.api.staging.dat.com/posting
Non-Production - Test: https://freight.api.nprod.dat.com/posting

## Security
bearerAuth (JWT)

## Freight Posting
### Create a New Post
- POST /v2/loads
Description: Create a new freight post for the DAT load board. Posts can be shared to a Private Network.
Rate Limit: 100 requests per minute, per user.

### View Posts by User
- GET /v2/loads
Description: Retrieve current and historical posting data for the authenticated user.
Rate Limit: 100 requests per minute, per user.

### Delete a Single Post
- DELETE /v2/loads
Description: Asynchronously delete a single post by id(LoadPostingId) or referenceId.

### Refresh a Single Post
- POST /v2/loads/{id}/refresh
Description: Refresh a single post wherever it is displayed. The post will appear "new"/"newer" in search results.

### View a Single Post by ID
- GET /v2/loads/{id}

### Update a Single Post
- PATCH /v2/loads/{id}
Description: Update the contents of an existing post.

## Bulk Tasks
### Create a Bulk Task
- POST /v2/loads/tasks
Description: Create a bulk task to create, update, delete, or refresh multiple posts at the same time.

### View Bulk Tasks by User
- GET /v2/loads/tasks

### View Bulk Task Details
- GET /v2/loads/tasks/{id}


---
## Source: https://developer.dat.com/developer-portal/post-loads-and-trucks/negotiation.md

# Freight Negotiation API

Version: 2.13.1

## Servers
Production: https://freight.api.prod.dat.com/negotiation
Non-Prod Staging: https://freight.api.staging.dat.com/negotiation
Non-Prod Test: https://freight.api.nprod.dat.com/negotiation

## Bid
### Create a bid
- POST /v2/bids

### Get a list of bids
- GET /v2/bids

### Bulk update bids
- PUT /v2/bids

### View bid counts for postings
- GET /v2/bids/aggregations

### View a single bid
- GET /v2/bids/{bidId}

### Update bid
- PATCH /v2/bids/{bidId}

## Counter Offer
### Create a counter offer
- POST /v2/bids/{bidId}/createCounterOffer

### Reject a counter offer
- POST /v2/bids/{bidId}/rejectCounterOffer

### Accept a counter offer
- POST /v2/bids/{bidId}/acceptCounterOffer

### Cancel a counter offer
- POST /v2/bids/{bidId}/cancelCounterOffer


---
## Source: https://developer.dat.com/developer-portal/post-loads-and-trucks/truck-posting.md

# Truck Posting

Version: 8.7.0

## Servers
Production: https://freight.api.dat.com/posting

## Truck Posting
### Create a truck posting
- POST /v2/trucks

### Get all truck postings
- GET /v2/trucks

### Get a truck posting
- GET /v2/trucks/{id}

### Update a truck posting
- PATCH /v2/trucks/{id}

### Delete a truck posting
- DELETE /v2/trucks/{id}

### Refresh a Truck Posting
- POST /v2/trucks/{id}/refresh

### Create a Bulk Task
- POST /v2/trucks/tasks


---
## Source: https://developer.dat.com/developer-portal/find-loads-and-trucks/freight-matching-search.md

# Search Freight Marketplaces

Version: 4.81.1

## Servers
Prod-Freight: https://freight.api.prod.dat.com

## Loads
### Find Loads
- POST /marketplaces/v1/loads/search
Search for Load Postings via DAT's V4 Search System

### Get Load Details
- GET /marketplaces/v1/loads/search/{resultId}
Get the details of a load search result.

### Stop Alerts
- DELETE /marketplaces/v1/loads/matchAlerts/{searchId}

## Equipment
### Find Equipment
- POST /marketplaces/v1/equipment/search
Search for Equipment Postings via DAT's V4 Search System.

### Get Equipment Details
- GET /marketplaces/v1/equipment/search/{resultId}


---
## Source: https://developer.dat.com/developer-portal/find-loads-and-trucks/freight-matching-search/v3.md

# Search v3

Version: 3.2.3

## Servers
Production: https://freight.api.prod.dat.com

## Asset Queries
### Create an Asset Query
- POST /search/v3/queries
Description: Create a new asset query by defining shipment or truck criteria. Execute the search to view results.

### Asset Query by User
- GET /search/v3/queries

### Asset Query by queryID
- GET /search/v3/queries/{queryId}

### Delete an Asset Query
- DELETE /search/v3/queries/{queryId}

### Retrieve Asset Query Results
- GET /search/v3/queryMatches/{queryId}
Description: Retrieves assets matching the criteria defined in an existing asset query.

### Retrieve Details of a Previously Queried Asset
- GET /search/v3/matchDetails/{matchId}


---
## Source: https://developer.dat.com/developer-portal/lookup-freight-rates/rates-linehaul.md

# Rate Lookup

Version: 1.0.0

## Servers
Production: https://analytics.api.dat.com/linehaulrates

## rates
### Request Rate data
- POST /v1/lookups
Retrieve Rateview data based on a location point search that specifies geographies, equipment type, rate type, time period, and the escalation (timeframe and area).

### Retrieve a specific rate lookup request
- GET /v1/lookups/{transaction}

### Request Historic Rate data
- POST /v1/history

### Request National Historic Rate data
- POST /v1/nationalHistory

### Request a Rate Matrix file
- POST /v1/rateMatrix/file


---
## Source: https://developer.dat.com/developer-portal/lookup-freight-rates/ratecast.md

# Ratecast API

Version: 1.0.9

## Servers
Production-Ratecast: https://analytics.api.dat.com/linehaulrates

## Ratecast
### Retrieve Spot Rate Forecast
- POST /v1/forecasts/spot

### Retrieve Contract Rate Forecast
- POST /v1/forecasts/contract

