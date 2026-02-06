# Marketing Module - Complete Infrastructure

> **Status**: Schema Complete ✅ | Updated: 2026-02-05

## 🎯 Campaign Planning Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAMPAIGN CREATION                                    │
│  Name, Type, Budget, Goals (Leads/Enrollments/Revenue), ROAS Target         │
│  Attribution Model: First Touch | Last Touch | Linear | Time Decay          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  ONLINE FUNNEL   │    │  OFFLINE FUNNEL  │    │   PARTNERSHIPS   │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ • Landing Pages  │    │ • Marketing Events│   │ • Influencers    │
│ • A/B Testing    │    │ • QR Codes        │    │ • Local Business │
│ • Meta Ads       │    │ • Print Materials │    │ • Schools        │
│ • Google Ads     │    │ • Flyering        │    │ • Commissions    │
│ • Email/WhatsApp │    │ • Fairs/Workshops │    │ • Referral Codes │
└──────────────────┘    └──────────────────┘    └──────────────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRACKING & ATTRIBUTION                               │
│  Visitors → Sessions → Events → QR Scans → Leads → Enrollments              │
│  Multi-touch attribution, UTM tracking, offline-to-online linking           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANALYTICS & ROAS                                     │
│  Daily metrics, CAC, CPL, CVR, ROAS by campaign/channel/location            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Implemented Schema (Complete)

### Core Marketing Tables
| Table | Purpose | Status |
|-------|---------|--------|
| `campaigns` | Campaign planning with ROAS targets, ad platform sync | ✅ Enhanced |
| `campaignLeads` | Lead ↔ Campaign attribution | ✅ |
| `campaignDailyMetrics` | Daily ROAS, CAC, CPL, CVR | ✅ New |
| `marketingTargets` | TOFU/MOFU/BOFU goals by period | ✅ New |
| `marketingIntegrations` | Meta, Google, LinkedIn pixels | ✅ New |

### Visitor & Session Tracking
| Table | Purpose | Status |
|-------|---------|--------|
| `visitors` | Anonymous pre-lead tracking, fingerprint | ✅ New |
| `sessions` | Session-level UTM and behavior | ✅ New |
| `trackingEvents` | Page views, clicks, form events | ✅ New |

### Landing Pages & A/B Testing
| Table | Purpose | Status |
|-------|---------|--------|
| `landingPages` | Full page builder with A/B variants | ✅ Enhanced |
| `abTestAssignments` | Visitor → variant assignment | ✅ New |
| `landingPageDailyMetrics` | Aggregated page performance | ✅ New |

### Content Production Pipeline
| Table | Purpose | Status |
|-------|---------|--------|
| `contentTypes` | Define formats (IG Post, Flyer A5, Banner) | ✅ New |
| `contentAssets` | Asset library with approval workflow | ✅ New |
| `contentCalendar` | Production scheduling | ✅ New |

### Offline Marketing (Person-to-Person)
| Table | Purpose | Status |
|-------|---------|--------|
| `marketingEvents` | Open houses, workshops, fairs, flyering | ✅ New |
| `eventRegistrations` | RSVPs, attendance, follow-up | ✅ New |
| `marketingPartners` | Influencers, local businesses | ✅ New |

### QR Code Tracking (Offline → Online Bridge)
| Table | Purpose | Status |
|-------|---------|--------|
| `qrCodes` | Trackable QR codes with location/campaign tags | ✅ New |
| `qrScans` | Individual scan records with conversion tracking | ✅ New |

### Lead Attribution (Enhanced)
| Field | Location | Purpose |
|-------|----------|---------|
| `firstSource/Medium/CampaignId` | `leads` | First touch attribution |
| `lastSource/Medium/CampaignId` | `leads` | Last touch attribution |
| `firstLandingPage/lastLandingPage` | `leads` | Full journey tracking |
| `visitorId` | `leads` | Link to anonymous history |
| `utmSource/Medium/Campaign/Content/Term` | `leads` | Full UTM suite |

---

## 💼 Campaign Types Supported

### Digital Campaigns
- **Paid Ads**: Meta (Facebook/Instagram), Google Ads, LinkedIn
- **Organic**: SEO, content marketing
- **Email/WhatsApp**: Sequences, broadcasts
- **Landing Pages**: A/B tested, conversion optimized

### Offline Campaigns
- **Events**: Open houses, workshops, fairs, school visits
- **Flyering**: Street distribution with QR tracking
- **Partnerships**: Local businesses, influencers
- **Print Materials**: Flyers, banners, posters, vehicle wraps

### Hybrid Campaigns
- QR codes link offline materials to online funnels
- Event registrations captured digitally
- Partner referrals tracked with codes

---

## 📊 Metrics Available

### Campaign-Level
| Metric | Formula |
|--------|---------|
| **CAC** | Total Spend / Enrollments |
| **CPL** | Total Spend / Leads |
| **CVR** | Leads / Visitors × 100 |
| **ROAS** | Revenue / Ad Spend |
| **Goal %** | Actual / Target × 100 |

### Channel-Level
- Visitors, Leads, Enrollments by channel
- Spend by channel
- Attribution breakdown (first/last touch)

### Location-Level (via QR)
- Scans by neighborhood/partner
- Leads by physical location
- Best performing distribution spots

---

## 🔧 Next Steps (Implementation Order)

### Phase 1: Core Tracking (Priority)
- [ ] Implement `/api/track` endpoint for events
- [ ] Create tracking script for school websites
- [ ] Wire up visitor/session creation flow
- [ ] Server-side conversion events (Meta CAPI, GA4)

### Phase 2: QR System
- [ ] Port QR generator from `QR_IMPLEMENTATION_GUIDE.md`
- [ ] Create QR management UI
- [ ] Implement `/api/qr/scan` redirect endpoint
- [ ] QR code dashboard with scan analytics

### Phase 3: Campaign Management UI
- [ ] Campaign creation wizard
- [ ] Content calendar view
- [ ] Event planning & registration
- [ ] Partner management

### Phase 4: Analytics Dashboard
- [ ] Real-time campaign metrics
- [ ] Attribution reports
- [ ] ROAS calculations
- [ ] Goal progress tracking

### Phase 5: Automations
- [ ] Auto-sync with ad platforms
- [ ] Lead scoring based on behavior
- [ ] Trigger-based nurturing
- [ ] Weekly heartbeat reports

---

## 📋 API Endpoints Needed

### Tracking
```
POST /api/track                    # Client-side event tracking
POST /api/track/identify           # Link visitor to lead
GET  /api/qr/:code                 # QR redirect with scan tracking
```

### Campaigns
```
GET  /api/{org}/marketing/campaigns
POST /api/{org}/marketing/campaigns
PUT  /api/{org}/marketing/campaigns/:id
POST /api/{org}/marketing/campaigns/:id/sync  # Sync from ad platform
```

### Content
```
GET  /api/{org}/marketing/assets
POST /api/{org}/marketing/assets
PUT  /api/{org}/marketing/assets/:id/approve
GET  /api/{org}/marketing/calendar
```

### Events
```
GET  /api/{org}/marketing/events
POST /api/{org}/marketing/events
POST /api/{org}/marketing/events/:id/register
GET  /api/{org}/marketing/events/:id/attendees
```

### QR Codes
```
GET  /api/{org}/marketing/qr
POST /api/{org}/marketing/qr
GET  /api/{org}/marketing/qr/:id/stats
POST /api/{org}/marketing/qr/:id/regenerate
```

### Partners
```
GET  /api/{org}/marketing/partners
POST /api/{org}/marketing/partners
GET  /api/{org}/marketing/partners/:id/leads
```

### Targets & Analytics
```
GET  /api/{org}/marketing/targets/current
POST /api/{org}/marketing/targets
GET  /api/{org}/marketing/analytics/dashboard
GET  /api/{org}/marketing/analytics/attribution
```

---

## 🎨 UI Pages Needed

| Page | Path | Purpose |
|------|------|---------|
| Marketing Command | `/staff/marketing` | KPI dashboard, quick actions |
| Campaigns | `/staff/marketing/campanhas` | Campaign list & creation |
| Content Library | `/staff/marketing/conteudo` | Assets, calendar |
| Events | `/staff/marketing/eventos` | Event planning |
| QR Codes | `/staff/marketing/qr` | QR management |
| Partners | `/staff/marketing/parcerias` | Partner tracking |
| Analytics | `/staff/marketing/analytics` | Deep dive reports |
| Settings | `/admin/marketing/configuracoes` | Pixels, attribution |

---

*Marketing module schema complete. Ready for API and UI implementation.*
