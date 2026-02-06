# Marketing Module - API Reference

> **Version**: 1.0 | **Base Path**: `/api`

---

## Overview

The Marketing Module provides APIs for:
- **QR Code Generation & Tracking** - Offline-to-online attribution
- **Event Tracking** - Client-side analytics
- **Campaign Management** - CRUD operations
- **Content & Assets** - Production pipeline
- **Partners & Events** - Person-to-person marketing

---

## 🔲 QR Code System

### Generate QR Code

**`POST /api/qr/generate`**

Generate a branded QR code image.

#### Request Body

```json
{
  "data": "https://school.com/form?utm_source=qr",
  "width": 400,
  "format": "base64",
  "primaryColor": "#7048e8",
  "backgroundColor": "#FFFFFF",
  "moduleStyle": "rounded",
  "logoUrl": "https://school.com/logo.png",
  "logoSizeRatio": 0.25,
  "frameText": "Matricule-se!",
  "frameTextSize": 24,
  "errorCorrectionLevel": "H"
}
```

#### Parameters

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | string | *required* | URL or text to encode |
| `width` | number | 400 | Output width in pixels |
| `format` | enum | "base64" | `png`, `svg`, or `base64` |
| `primaryColor` | string | "#7048e8" | Module color (hex) |
| `backgroundColor` | string | "#FFFFFF" | Background color (hex) |
| `moduleStyle` | enum | "rounded" | `square`, `rounded`, `circle` |
| `logoUrl` | string | null | Logo to embed in center |
| `logoSizeRatio` | number | 0.25 | Logo size (0.15-0.30) |
| `frameText` | string | null | Text below QR |
| `frameTextSize` | number | 24 | Frame text size |
| `errorCorrectionLevel` | enum | "H" | `L`, `M`, `Q`, `H` |

#### Response (format=base64)

```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "mimeType": "image/png",
  "width": 400,
  "height": 460
}
```

#### Response (format=png)

Returns binary PNG with `Content-Type: image/png`

---

### QR Scan Redirect

**`GET /api/qr/scan/[code]`**

Handles QR code scans. Records attribution data and redirects to destination.

#### Flow

```
1. User scans QR code
2. Request hits /api/qr/scan/abc123
3. System records scan (device, geo, time)
4. Creates/links visitor record
5. Creates session with UTM params
6. Updates QR code stats
7. Redirects to destination URL
```

#### Response

- **302 Redirect** to destination URL with UTM parameters
- Sets cookies: `_fp` (fingerprint), `_sid` (session)

#### Error Responses

| Code | URL | Reason |
|------|-----|--------|
| 302 | `/404` | QR code not found |
| 302 | `/qr-expired` | QR code paused/expired |
| 302 | `/` | System error (graceful fallback) |

---

## 📊 Event Tracking

### Track Event

**`POST /api/marketing/tracking`**

Client-side event tracking for analytics.

#### Request Body

```json
{
  "organizationId": "org_123",
  "eventType": "page_view",
  "eventName": "Homepage View",
  "pageUrl": "/",
  "properties": {
    "referrer": "google.com",
    "scrollDepth": 75
  },
  "valueCents": 0,
  "currency": "BRL"
}
```

#### Event Types

| Type | Description |
|------|-------------|
| `page_view` | Page load |
| `scroll` | Scroll depth milestone |
| `click` | Button/link click |
| `form_start` | Form interaction started |
| `form_submit` | Form submitted |
| `video_play` | Video started |
| `video_complete` | Video finished |
| `lead` | Lead conversion |
| `purchase` | Purchase conversion |
| `custom` | Custom event |

#### Response

```json
{
  "success": true
}
```

---

### Tracking Pixel

**`GET /api/marketing/tracking`**

1x1 transparent pixel for email/simple tracking.

#### Query Parameters

| Param | Description |
|-------|-------------|
| `org` | Organization ID |
| `e` | Event type (default: page_view) |
| `url` | Page URL |

#### Example

```html
<img src="/api/marketing/tracking?org=org_123&e=email_open&url=campaign_123" />
```

---

## 📋 Campaign Management

### List Campaigns

**`GET /api/[org]/marketing/campaigns`**

```json
{
  "campaigns": [
    {
      "id": "camp_123",
      "name": "Campanha Verão 2026",
      "status": "active",
      "budgetCents": 1000000,
      "spentCents": 450000,
      "goalLeads": 100,
      "actualLeads": 67,
      "targetRoas": 3.0,
      "actualRoas": 2.8,
      "startsAt": 1738800000,
      "endsAt": 1741478400
    }
  ]
}
```

### Create Campaign

**`POST /api/[org]/marketing/campaigns`**

```json
{
  "name": "Campanha Verão 2026",
  "campaignType": "enrollment",
  "channels": ["instagram", "google", "flyer"],
  "budgetCents": 1000000,
  "startsAt": 1738800000,
  "endsAt": 1741478400,
  "goalLeads": 100,
  "goalEnrollments": 20,
  "targetRoas": 3.0,
  "attributionModel": "last_touch",
  "attributionWindowDays": 30
}
```

### Sync Campaign from Ad Platform

**`POST /api/[org]/marketing/campaigns/[id]/sync`**

Pulls latest metrics from Meta/Google Ads.

```json
{
  "platform": "meta",
  "dateRange": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  }
}
```

---

## 🔲 QR Code Management

### List QR Codes

**`GET /api/[org]/marketing/qr`**

```json
{
  "qrCodes": [
    {
      "id": "qr_123",
      "code": "abc123",
      "name": "Flyer Shopping Ibirapuera",
      "campaignId": "camp_123",
      "locationName": "Shopping Ibirapuera",
      "locationType": "flyer",
      "totalScans": 47,
      "uniqueScans": 32,
      "leadsGenerated": 8,
      "status": "active"
    }
  ]
}
```

### Create QR Code

**`POST /api/[org]/marketing/qr`**

```json
{
  "name": "Flyer Shopping Ibirapuera",
  "campaignId": "camp_123",
  "location": {
    "name": "Shopping Ibirapuera",
    "type": "flyer",
    "neighborhood": "Moema",
    "city": "São Paulo"
  },
  "destination": {
    "type": "form",
    "formSlug": "lead-capture"
  },
  "utm": {
    "source": "qr",
    "medium": "flyer",
    "campaign": "verao-2026",
    "content": "shopping-ibirapuera"
  },
  "primaryColor": "#7048e8",
  "frameText": "Matricule-se!"
}
```

### Get QR Stats

**`GET /api/[org]/marketing/qr/[id]/stats`**

```json
{
  "qrCode": {
    "id": "qr_123",
    "code": "abc123",
    "name": "Flyer Shopping Ibirapuera"
  },
  "stats": {
    "totalScans": 47,
    "uniqueScans": 32,
    "leadsGenerated": 8,
    "conversionRate": 25.0,
    "byDevice": {
      "mobile": 42,
      "desktop": 3,
      "tablet": 2
    },
    "byDay": [
      { "date": "2026-02-01", "scans": 12 },
      { "date": "2026-02-02", "scans": 8 }
    ],
    "topCities": [
      { "city": "São Paulo", "scans": 35 },
      { "city": "Campinas", "scans": 7 }
    ]
  }
}
```

---

## 🎨 Content & Assets

### List Content Types

**`GET /api/[org]/marketing/content-types`**

```json
{
  "contentTypes": [
    {
      "id": "ct_1",
      "code": "ig_post",
      "name": "Instagram Post",
      "channel": "digital",
      "platform": "instagram",
      "requiredAssets": ["image", "copy"]
    },
    {
      "id": "ct_2",
      "code": "flyer_a5",
      "name": "Flyer A5",
      "channel": "print",
      "printFormat": "A5",
      "estimatedCostCents": 50
    }
  ]
}
```

### List Content Assets

**`GET /api/[org]/marketing/assets`**

Query params: `campaignId`, `status`, `assetType`

### Create Asset

**`POST /api/[org]/marketing/assets`**

Multipart form data for file upload, or JSON for copy-only.

### Approve Asset

**`PUT /api/[org]/marketing/assets/[id]/approve`**

```json
{
  "status": "approved"
}
```

---

## 📅 Marketing Events

### List Events

**`GET /api/[org]/marketing/events`**

Query params: `status`, `eventType`, `startDate`, `endDate`

### Create Event

**`POST /api/[org]/marketing/events`**

```json
{
  "name": "Portas Abertas Fevereiro",
  "eventType": "open_house",
  "campaignId": "camp_123",
  "startsAt": 1739192400,
  "endsAt": 1739203200,
  "venue": "Escola XYZ",
  "maxAttendees": 50,
  "materialsNeeded": ["flyers", "banner", "tablets"],
  "leadStaffId": "user_456"
}
```

### Register for Event

**`POST /api/[org]/marketing/events/[id]/register`**

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999887766"
}
```

---

## 🤝 Partners

### List Partners

**`GET /api/[org]/marketing/partners`**

### Create Partner

**`POST /api/[org]/marketing/partners`**

```json
{
  "name": "Academia Fitness XYZ",
  "type": "business",
  "contactName": "Maria Santos",
  "email": "maria@fitxyz.com",
  "neighborhood": "Moema",
  "city": "São Paulo",
  "partnershipType": "discount_exchange",
  "discountOffered": 10,
  "referralCode": "FITXYZ10"
}
```

### Get Partner Leads

**`GET /api/[org]/marketing/partners/[id]/leads`**

Returns leads attributed to this partner.

---

## 📊 Analytics & Targets

### Get Dashboard

**`GET /api/[org]/marketing/analytics/dashboard`**

```json
{
  "period": "last_30_days",
  "metrics": {
    "visitors": 4521,
    "leads": 234,
    "enrollments": 47,
    "spend": 850000,
    "revenue": 2350000,
    "cac": 18085,
    "cpl": 3632,
    "cvr": 5.18,
    "roas": 2.76
  },
  "byChannel": [
    {
      "channel": "instagram",
      "visitors": 2100,
      "leads": 120,
      "enrollments": 25,
      "spend": 400000
    }
  ],
  "byQRLocation": [
    {
      "location": "Shopping Ibirapuera",
      "scans": 156,
      "leads": 12
    }
  ]
}
```

### Get Current Targets

**`GET /api/[org]/marketing/targets/current`**

```json
{
  "period": {
    "type": "monthly",
    "start": 1738368000,
    "end": 1740787200
  },
  "targets": {
    "visitors": 5000,
    "leads": 300,
    "enrollments": 60,
    "roas": 3.0
  },
  "actuals": {
    "visitors": 4521,
    "leads": 234,
    "enrollments": 47,
    "roas": 2.76
  },
  "progress": {
    "visitors": 90.4,
    "leads": 78.0,
    "enrollments": 78.3,
    "roas": 92.0
  }
}
```

### Set Targets

**`POST /api/[org]/marketing/targets`**

```json
{
  "periodType": "monthly",
  "periodStart": 1740787200,
  "periodEnd": 1743465600,
  "targetVisitors": 6000,
  "targetLeads": 350,
  "targetEnrollments": 70,
  "targetRoas": 3.0,
  "targetCplCents": 3500,
  "targetCacCents": 15000
}
```

---

## 🔐 Authentication

All endpoints require authentication via Clerk session.

- Org-scoped endpoints check user membership
- Platform admins can access all orgs
- Rate limiting: 100 requests/minute per user

---

## 📦 Webhook Events (Future)

Marketing module will emit events:

- `marketing.lead.created`
- `marketing.enrollment.attributed`
- `marketing.campaign.budget_warning`
- `marketing.qr.scan`
- `marketing.event.registration`

---

*Last Updated: 2026-02-05*
