# DAT Developer Portal Documentation Extraction

## Source: https://developer.dat.com/developer-portal/post-loads-and-trucks/main.md
**Jump to:** [Zip Code Validation](/developer-portal/post-loads-and-trucks/zip-code-validation) | [Instant Bookable Loads APIs](#instant-bookable-loads-apis) | [Instant Bookable Loads: Freight Posting API](#freight-posting-api-integration) | [Instant Bookable Loads: Freight Negotiation API](#freight-negotiation-api-integration) | [Instant Bookable Loads: Private Network API](#private-network-integration) | [Private Network API](#private-network-api) | [Certification](#certification)

# Post Freight and Trucks

Use the APIs in this category to post freight and trucks to the:

* DAT Load Board
* Private Network


## DAT Load Board

The DAT Load Board provides real-time spot market freight and capacity information. Shippers and brokers can post full and partial loads. Carriers can search and book in one or multiple travel lanes and geographies.

* [Asset Management SOAP API](/developer-portal/soap-api/services-summary/asset-management)
* [Freight Load Posting API](/developer-portal/post-loads-and-trucks/freight-posting)
* [Freight Truck Posting API](/developer-portal/post-loads-and-trucks/truck-posting)


## Instant Bookable Loads APIs

* [Freight Posting API](/developer-portal/post-loads-and-trucks/freight-posting)
* [Freight Posting API for Bookable Loads](/developer-portal/post-loads-and-trucks/freight-posting) - (Posting Response, TmsNotification Modeling file)
* [Freight Negotiation API v2](/developer-portal/post-loads-and-trucks/negotiation)


## Integrating Instant Bookable Loads

Instant Bookable Loads are posts that carriers can search, select, and rate-lock directly from their mobile device or desktop. They can be integrated using the [Freight Posting API](/developer-portal/post-loads-and-trucks/freight-posting) or [Freight Negotiaion API](/developer-portal/post-loads-and-trucks/negotiation).

When a carrier selects an instant bookable post using the Freight Posting API the rate is non-negotiable. They are either:

* redirected to the broker/shipper website to complete booking or
* their information is sent to the broker/shipper TMS for final booking


### Freight Posting API Integration

**Method 1: Direct Broker/Shipper URL**

1. Load is posted to the DAT Load Board with a bookable element.
2. The API provides a link to the broker/shipper Portal URL.
3. Carrier goes to the Portal URL to complete booking.
4. API response model provides a Base64 encoded link (URL) that automatically opens a window to the internal load board (Carrier Portal).
5. Carrier information encoded in the URL is passed through to the broker/shipper. (I.e., the Carrier MC, DOT, Customer Load ID DAT Load ID and email).


**Method 2: TMS Booking Request**

1. Carrier sends a booking request from within the DAT Load Board to the broker/shipper TMS.
2. Load is posted to the DAT Load Board with a bookable element.
3. The API provides a link to the broker/shipper local TMS.
4. Carrier sends a booking request from within the DAT Load Board to the TMS.
5. Carrier information is sent to the TMS. (I.e., the Carrier MC, DOT, Customer Load ID DAT Load ID and email).


### Freight Negotiation API Integration

This API integration differs from the [Freight Posting API](#freight-posting-api-integration) in that there is no rate-lock. The rate is negotiable.

For each load posted and carrier selection, the user sends DAT details about the booking process. This includes accepted/rejected rates and associated freight information.

### Private Network Integration

Instant Bookable Loads posted to a Private Network can allow carriers to negotiate or bid on the listed rate. When a carriers submits a bid other than the listed rate, the broker/shipper can either accept or reject it.

## Private Network API

The Private Network API allows users to create and manage a network of carriers private to their office. Freight posts can only be viewed by those select carriers.

Users can view the information for contacts in a specific Private Network, as well as add, update, and delete contacts as needed.

These are the required APIs to create, manage, and use Private Networks:

* [Private Network API](/developer-portal/manage-private-network/private-network)
* [Freight Posting API](/developer-portal/post-loads-and-trucks/freight-posting)


## Certification

This integration must be certified by DAT prior to deployment. Use the checklist below during configuration to ensure all requirements are met.

[Load Board Certification Checklist](/developer-portal/post-loads-and-trucks/post-certification-checklist)

---
## Source: https://developer.dat.com/developer-portal/authentication/main.md
# Authorization

## DAT Access API

DAT APIs require JSON Web Token (JWT) authentication. The DAT Access API enables integrators to create the access tokens used in API calls to other DAT systems that require authentication.

There are two types of third-party access tokens:

* Organizational
* Individual

## Overview

### Credentials (Production)

**Note:** DAT Tech Support will set up production Service Account credentials on their behalf of the client, however the actual username and password are determined by the client.

### Steps

1. Call: https://identity.api.dat.com/access/v1/token/organization
2. Obtain organizational access token
3. Use organizational access token to call: https://identity.api.dat.com/access/v1/token/user
4. Access endpoint

## How Authentication Works

Authentication requires both an organizational and an individual access token. Tokens expire after 30 minutes.

### Organizational Access Token

**Note:** The sole purpose of the `accessToken` returned in the response body of this endpoint is to permit individual authentication. It does not provide direct API access.

* assigned to each company by DAT technical support
* associated with a specific company "Service Account" email and password
* password must be set by a company administrator and then **shared** with all users

### Individual Access Token

**Note:**  Use the `accessToken` returned in the response body of this endpoint, in the authorization request header to access individual endpoints. *A valid organizational access token is required for  this endpoint to work.*

* access token login is the email address used to log in to the DAT interface
* associated with an individual user

## Access Token Use

* An expiration date/time is returned with each `accessToken`.
* Cache and reuse individual access tokens for endpoints until they expire.
* Enter organization level `accessToken` in the individual token authorization request header as: Authorization: Bearer {{orgAccessToken}}
* Access tokens expire after **30 minutes**.
* If the organizational access token expires *before* a user's individual access token, open sessions won't be abandoned mid request/response.

---
## Source: https://developer.dat.com/developer-portal/authentication/access.md
# Access Token API

Version: 0.1.0.0

## Servers

Non-Prod Test
https://identity.api.nprod.dat.com/access

Non-Prod Staging
https://identity.api.staging.dat.com/access

Production
https://identity.api.dat.com/access

## Security
### Oauth2
Type: http
Scheme: bearer
Bearer Format: JWT

## AccessToken

### 3rd party token for an organization
 - POST /v1/token/organization: The endpoint used by a 3rd party to retrieve the access token for an organization.

### 3rd party token for a user account
 - POST /v1/token/user: The endpoint used by a 3rd party to retrieve an access token for a user account.

### JSON Web Key Set
 - GET /.well-known/jwks.json: The endpoint used to retrieve JSON Web Key Sets (JWKS).
 

---
## Source: https://developer.dat.com/developer-portal/find-loads-and-trucks/main.md
# Search Freight and Trucks

## Load Board

The DAT Load Board provides real-time spot market freight and capacity information. Shippers and brokers can post full and partial loads. Carriers can search and book in one or multiple travel lanes and geographies.

* [Search v4 API (NEW)](/developer-portal/find-loads-and-trucks/freight-matching-search)
* [Search v3 API](/developer-portal/find-loads-and-trucks/freight-matching-search/v3)
* Search v1 API (Discontinued)
* [Search Service SOAP API (Deprecated)](/developer-portal/soap-api/services-summary/search)

---
## Source: https://developer.dat.com/developer-portal/lookup-freight-rates/main.md
# Lookup Freight Rates

**Jump to:** [Ratecast API](#ratecast-api)

## Rate Lookup API

The Rate Lookup API allows users to request spot and contract market rate information based on data from DAT’s RateView application.

* DAT RateView Combo Pro and Shipper Pro subscriptions are required to use this API.
* Each successful rate response is debited from the lane credits associated with the user’s RateView subscription.

#### Current Rate Requests

Users can request current rate information. RateView contributors can see rate information for their submitted lanes.

#### Historical Rate Request

Users can request up to 13 months of historic rate information for a single lane or a batch of up to 50 lanes.

[Rate Lookup API](/developer-portal/lookup-freight-rates/rates-linehaul)

## Ratecast API

*This is an early-access release. User access is granted upon request.*

The Ratecast API provides comprehensive rate forecast data that can be added to a local TMS. Best available forecast data is based on a location point search that specifies the to/from geographies used to calculate trip distance.

#### Forecast Periods

* 8-day forecasts
* 35-day forecasts
* 52-week forecasts

#### Search Types

* Location: *to/from a specific city, one or more zip codes/postal codes, region, or country*
* Category: *van, reefer, flatbed*

[Ratecast API](/developer-portal/lookup-freight-rates/ratecast)

---
## Source: https://developer.dat.com/developer-portal/contributions/main.md
# Rate Contributions

The Contributions API allows users to create and view rate contributions created by different types of users. Carriers, brokers, and shippers can submit rates for a single mode of transportation, or multiple modes of transportation (intermodal).

[Contributions API](/developer-portal/contributions/contributions)

---
## Source: https://developer.dat.com/developer-portal/market-conditions/main.md
# Analyze Market Conditions

*Note: The Market Conditions API is an early-access release and only available to Enterprise-level customers that request access.*

The Market Conditions API provides access to the Load-to-Truck Ratio and Market Conditions Index (MCI) data. Each application requires a separate subscription. Contact your account manager for subscription information and access questions.

### Get Early Access

To request early-access for your organization contact: techsupportteamleads@dat.com

---
## Source: https://developer.dat.com/developer-portal/manage-private-network/main.md
# Private Network

DAT offers brokers and shippers the option to configure a network of preferred carrier contacts. These trusted individuals and companies can receive:

* early access to new load posts
* exclusive access to high-demand loads
* preferential booking terms and conditions

Contact information can be added individually or via batch import.

## Batch Import Contacts

### Required Fields

| Field Name | Type | Description |
|  --- | --- | --- |
| Contact type | string | "INDIVIDUAL" or "COMPANY" |
| Contact name | string | required if `Contact type` is "INDIVIDUAL" |
| Email | string | required if `Contact type` is "INDIVIDUAL" |
| Contact email | string | required if `Contact type` is "COMPANY" |
| Operating authority | string | at least one operating authority field is required for each contact |
|     MC or MX number | string | - may begin with "MC" or "MX".  - prefix not required ("MC" implied in absence of prefix) |
|     FF number | number | may begin with "FF" and an optional separator ("/" or "-")  prefix not required |
|     DOT number | number | may begin with "DOT" and an optional separator ("/" or "-"). |
|     US intrastate number  | string | must begin with a 2-character state code and separator ("/" or "-") |
|     Canadian authority number  | string |  |

---
## Source: https://developer.dat.com/developer-portal/lanemakers/lanemakers.md
# Advanced Lanemakers API

This API is designed to support the Advanced Lanemakers app.
**Basic Freight-Match** subscription is required to use this API. Advanced features require either the **Freight-Match Office** subscription or the **Premium Lanemakers** add-on.

Version: 3.1.0

## Servers

Prod
https://network.api.dat.com/lanemakers

Staging
https://network.api.staging.dat.com/lanemakers

Test
https://network.api.nprod.dat.com/lanemakers

## Security

### bearer
Type: http
Scheme: bearer
Bearer Format: JWT

### bearerM2M
Type: http
Scheme: bearer
Bearer Format: JWT

## Get Lane Rankings
 - GET /v2/laneRankings

## Get Reports
 - GET /v2/reports: Allows users to retrieve searches and postings for a given lane.
Rate Limit: 120 requests per minute

---
## Source: https://developer.dat.com/developer-portal/other-resources/external-url-search.md
# Search with External URL

## Description

This document describes how to create and use an external URL to execute a truck or load search in DAT One Web. This method is typically used to initiate a search outside of the DAT One Web application via a local TMS.

## URL Format

| **Type** | **Root** | **Specification** |
|  --- | --- | --- |
| Production | https://one.dat.com?externalSearch= |  |
| Non-Production / Testing | https://one.nprod.dat.com?externalSearch= |  |


## Steps

### 1. Create JSON Object

Create a JSON object with parameters for search criteria.


```json
jsonData = {
  "urlSource": "TMS Inc",
  "searchType": "T",
  "origin": {
    "city": "Chicago",
    "state": "IL"
  },
  "destination": {
    "states": ["MO"]
  },
  "equipmentClasses": ["V"]
}
```

### 2. Create External URL

Generate the external URL for the JSON object created.

```javascript
var dataString = JSON.stringify(jsonData);
var encodedData = encodeURIComponent(dataString);
var urlPrefix = "https://one.dat.com?externalSearch=";
var searchUrl = urlPrefix + encodedData;
```

### 3. Execute External URL

Use a complete search definition when creating the JSON object.

```json
{
  "urlSouce": "TMS Inc",
  "searchType": "T",
  "origin": {
    "city": "Chicago",
    "state": "IL"
  },
  "destination": {
    "states": ["IL","MO"],
    "areas": ["Z7","Z8"]
  },
  "equipmentClasses": ["V","R"],
  "availability": {
    "earliest": "2023-04-08T07:00:00.000Z",
    "latest": "2023-04-10T07:00:00.000Z"
  },
  "dho": 150,
  "dhd": 200,
  "fullPartial": "B",
  "length": 53,
  "weight": 30000,
  "searchBack": 24
}
```

