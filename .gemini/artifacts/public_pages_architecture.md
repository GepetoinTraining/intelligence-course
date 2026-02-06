# Public Pages & Branding System

> Unprotected routes structure for schools with custom domains and module-based pages

---

## URL Structure

### Option 1: Path-based (Default)
```
nodezero.app/                         → Platform landing
nodezero.app/intelligence-course/     → School landing
nodezero.app/intelligence-course/courses/ai-kids  → Course page
```

### Option 2: Custom Domain (Premium)
```
nodezero.app/                         → Platform landing
cursoai.com.br/                       → School landing (custom domain)
cursoai.com.br/courses/ai-kids        → Course page
```

### Option 3: Subdomain (Medium)
```
nodezero.app/                         → Platform landing
intelligence-course.nodezero.app/     → School landing
```

---

## Complete Public Routes Map

```
/[orgSlug]/                                    ← SCHOOL LANDING
├── (school landing page with branding)
│
├── courses/                                   ← COURSE CATALOG
│   ├── page.tsx                              → All courses grid
│   └── [courseSlug]/
│       └── page.tsx                          → Course sales page
│
├── form/                                      ← LEAD CAPTURE (Marketing)
│   └── [formSlug]/
│       └── page.tsx                          → Dynamic form
│
├── careers/                                   ← JOB LISTINGS (HR/Talent)
│   ├── page.tsx                              → All open positions
│   ├── [jobId]/
│   │   └── page.tsx                          → Job detail + apply
│   └── talent-pool/
│       └── page.tsx                          → Join talent pool
│
├── cert/                                      ← CERTIFICATES
│   └── [certId]/
│       └── page.tsx                          → Verify certificate
│
├── go/                                        ← SHORT LINKS (Marketing)
│   └── [code]/
│       └── page.tsx                          → Redirect handler
│
├── blog/                                      ← CONTENT (Marketing)
│   ├── page.tsx                              → Blog index
│   └── [slug]/
│       └── page.tsx                          → Blog post
│
├── events/                                    ← PUBLIC EVENTS (Operations)
│   ├── page.tsx                              → Events calendar
│   └── [eventId]/
│       └── page.tsx                          → Event details + register
│
├── testimonials/                              ← SOCIAL PROOF (Marketing)
│   └── page.tsx                              → Success stories
│
├── about/                                     ← ABOUT (Core)
│   └── page.tsx                              → About the school
│
├── contact/                                   ← CONTACT (Core)
│   └── page.tsx                              → Contact form
│
├── terms/                                     ← LEGAL (Core)
│   └── page.tsx                              → Terms of service
│
├── privacy/                                   ← LGPD (Core)
│   └── page.tsx                              → Privacy policy
│
└── faq/                                       ← FAQ (Core)
    └── page.tsx                              → Frequently asked questions
```

---

## Module-Gated Public Pages

| Module | Unlocks Public Pages |
|--------|---------------------|
| **Core** | `/`, `/about`, `/contact`, `/terms`, `/privacy`, `/faq` |
| **Pedagogical** | `/courses`, `/courses/[slug]`, `/cert/[id]` |
| **Marketing** | `/form/[slug]`, `/go/[code]`, `/blog`, `/blog/[slug]`, `/testimonials` |
| **HR (Talent)** | `/careers`, `/careers/[id]`, `/careers/talent-pool` |
| **Operations** | `/events`, `/events/[id]` |
| **Payments** | (no public pages, handled via enrollment) |

---

## Branding System

### Organization Branding Schema

```typescript
// Already in organizations table:
logoUrl: text('logo_url'),
faviconUrl: text('favicon_url'),
coverImageUrl: text('cover_image_url'),
primaryColor: text('primary_color').default('#7048e8'),
secondaryColor: text('secondary_color'),

// NEW: Extended branding
export const organizationBranding = sqliteTable('organization_branding', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').unique().notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    
    // ==========================================
    // LOGOS
    // ==========================================
    logoLightUrl: text('logo_light_url'),      // For dark backgrounds
    logoDarkUrl: text('logo_dark_url'),        // For light backgrounds
    logoIconUrl: text('logo_icon_url'),        // Small icon version
    faviconUrl: text('favicon_url'),
    ogImageUrl: text('og_image_url'),          // Social share image
    
    // ==========================================
    // COLORS
    // ==========================================
    primaryColor: text('primary_color').default('#7048e8'),
    primaryColorLight: text('primary_color_light'),
    primaryColorDark: text('primary_color_dark'),
    
    secondaryColor: text('secondary_color').default('#1c7ed6'),
    accentColor: text('accent_color').default('#fd7e14'),
    
    backgroundColor: text('background_color').default('#ffffff'),
    backgroundColorDark: text('background_color_dark').default('#1a1b1e'),
    
    textColor: text('text_color').default('#212529'),
    textColorMuted: text('text_color_muted').default('#868e96'),
    
    successColor: text('success_color').default('#40c057'),
    warningColor: text('warning_color').default('#fab005'),
    errorColor: text('error_color').default('#fa5252'),
    
    // ==========================================
    // TYPOGRAPHY
    // ==========================================
    fontHeading: text('font_heading').default('Inter'),       // Google Fonts name
    fontBody: text('font_body').default('Inter'),
    fontMono: text('font_mono').default('JetBrains Mono'),
    
    // Font weights
    fontWeightNormal: integer('font_weight_normal').default(400),
    fontWeightMedium: integer('font_weight_medium').default(500),
    fontWeightBold: integer('font_weight_bold').default(700),
    
    // ==========================================
    // IMAGES & MEDIA
    // ==========================================
    heroImageUrl: text('hero_image_url'),
    heroVideoUrl: text('hero_video_url'),
    patternImageUrl: text('pattern_image_url'),  // Background pattern
    
    // ==========================================
    // LAYOUT
    // ==========================================
    borderRadius: text('border_radius').default('md'),  // 'none', 'sm', 'md', 'lg', 'xl'
    containerWidth: text('container_width').default('1200px'),
    
    // ==========================================
    // SOCIAL
    // ==========================================
    socialLinks: text('social_links').default('{}'),  // JSON: {instagram: "...", youtube: "..."}
    
    // ==========================================
    // FOOTER
    // ==========================================
    footerText: text('footer_text'),
    showPoweredBy: integer('show_powered_by').default(1),  // "Powered by NodeZero"
    
    // ==========================================
    // CUSTOM CSS
    // ==========================================
    customCss: text('custom_css'),  // Premium: inject custom CSS
    
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
});
```

### Theme Provider

```typescript
// src/shared/providers/ThemeProvider.tsx

interface OrgTheme {
    colors: {
        primary: string;
        primaryLight: string;
        primaryDark: string;
        secondary: string;
        accent: string;
        background: string;
        backgroundDark: string;
        text: string;
        textMuted: string;
        success: string;
        warning: string;
        error: string;
    };
    fonts: {
        heading: string;
        body: string;
        mono: string;
    };
    images: {
        logo: string;
        logoLight: string;
        logoDark: string;
        favicon: string;
        ogImage: string;
        hero: string;
    };
    layout: {
        borderRadius: string;
        containerWidth: string;
    };
    social: Record<string, string>;
}

// Generate Mantine theme from org branding
function createMantineTheme(branding: OrganizationBranding): MantineTheme {
    return createTheme({
        primaryColor: 'brand',
        colors: {
            brand: generateColorScale(branding.primaryColor),
        },
        fontFamily: branding.fontBody,
        headings: {
            fontFamily: branding.fontHeading,
        },
        // ... other Mantine config
    });
}
```

---

## Custom Domains

### Schema Addition

```typescript
export const organizationDomains = sqliteTable('organization_domains', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    
    // Domain info
    domain: text('domain').unique().notNull(),  // "cursoai.com.br"
    isPrimary: integer('is_primary').default(0),
    
    // Verification
    verificationStatus: text('verification_status', {
        enum: ['pending', 'verified', 'failed']
    }).default('pending'),
    verificationToken: text('verification_token'),  // TXT record value
    verifiedAt: integer('verified_at'),
    
    // SSL
    sslStatus: text('ssl_status', {
        enum: ['pending', 'active', 'expired', 'error']
    }).default('pending'),
    sslExpiresAt: integer('ssl_expires_at'),
    
    createdAt: integer('created_at').default(timestamp()),
});
```

### Middleware Domain Resolution

```typescript
// In middleware.ts

async function resolveOrganization(hostname: string): Promise<Organization | null> {
    // 1. Check if it's the platform domain
    if (hostname === 'nodezero.app' || hostname === 'localhost:3000') {
        return null; // Platform context
    }
    
    // 2. Check if it's a subdomain
    if (hostname.endsWith('.nodezero.app')) {
        const slug = hostname.replace('.nodezero.app', '');
        return await getOrgBySlug(slug);
    }
    
    // 3. Check if it's a custom domain
    const domain = await db.query.organizationDomains.findFirst({
        where: and(
            eq(organizationDomains.domain, hostname),
            eq(organizationDomains.verificationStatus, 'verified')
        ),
        with: { organization: true }
    });
    
    if (domain) {
        return domain.organization;
    }
    
    return null;
}
```

---

## Landing Page Structure

### School Landing Page Component

```typescript
// /[orgSlug]/page.tsx

export default async function SchoolLandingPage({ params }) {
    const org = await getOrgWithBranding(params.orgSlug);
    const branding = org.branding;
    const courses = await getPublishedCourses(org.id);
    
    return (
        <ThemeProvider branding={branding}>
            {/* Hero Section */}
            <Hero
                title={org.displayName}
                subtitle={org.tagline}
                image={branding.heroImageUrl}
                cta={{ text: "Conheça nossos cursos", href: `/${org.slug}/courses` }}
            />
            
            {/* Value Props */}
            <Features features={org.valueProps} />
            
            {/* Featured Courses */}
            <CourseGrid courses={courses.slice(0, 3)} />
            
            {/* Testimonials (if marketing module) */}
            {org.hasModule('marketing') && (
                <Testimonials orgId={org.id} />
            )}
            
            {/* CTA Section */}
            <CTASection
                title="Comece sua jornada"
                subtitle="Escolha o curso ideal para você"
                primaryCta={{ text: "Ver cursos", href: `/${org.slug}/courses` }}
                secondaryCta={org.hasModule('marketing') 
                    ? { text: "Aula grátis", href: `/${org.slug}/form/trial` }
                    : undefined
                }
            />
            
            {/* Footer */}
            <Footer
                org={org}
                branding={branding}
                showPoweredBy={branding.showPoweredBy}
            />
        </ThemeProvider>
    );
}
```

### Course Landing Page

```typescript
// /[orgSlug]/courses/[courseSlug]/page.tsx

export default async function CourseLandingPage({ params }) {
    const org = await getOrgWithBranding(params.orgSlug);
    const course = await getCourseBySlug(org.id, params.courseSlug);
    
    return (
        <ThemeProvider branding={org.branding}>
            {/* Course Hero */}
            <CourseHero
                course={course}
                enrollCta={`/${org.slug}/form/${course.enrollmentFormSlug || 'enroll'}`}
            />
            
            {/* What You'll Learn */}
            <LearningOutcomes outcomes={course.outcomes} />
            
            {/* Curriculum Preview */}
            <CurriculumPreview modules={course.modules} />
            
            {/* Instructor */}
            <InstructorSection instructors={course.instructors} />
            
            {/* Pricing */}
            <PricingSection
                products={course.products}
                discountCode={params.searchParams?.code}
            />
            
            {/* FAQ */}
            <FAQSection faqs={course.faqs} />
            
            {/* Social Proof */}
            <SocialProof
                reviews={course.reviews}
                stats={course.stats}
            />
            
            {/* Final CTA */}
            <FinalCTA course={course} />
        </ThemeProvider>
    );
}
```

---

## Naming Convention for Multiple Landing Pages

### URL Patterns

```
/[orgSlug]/                           → Main school landing
/[orgSlug]/courses                    → Course catalog
/[orgSlug]/courses/[courseSlug]       → Individual course landing

# For specific campaigns/audiences:
/[orgSlug]/lp/[landingSlug]          → Custom landing pages
/[orgSlug]/lp/criancas               → Landing for kids
/[orgSlug]/lp/empresas               → Landing for B2B
/[orgSlug]/lp/black-friday           → Campaign landing

# With UTM tracking:
/[orgSlug]/lp/criancas?utm_source=instagram&utm_campaign=jan2026
```

### Landing Page Schema

```typescript
export const landingPages = sqliteTable('landing_pages', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    
    // Identity
    slug: text('slug').notNull(),  // "criancas", "empresas"
    title: text('title').notNull(),
    description: text('description'),
    
    // Target
    targetAudience: text('target_audience'),  // "kids", "professionals", "educators"
    courseId: text('course_id'),  // If tied to specific course
    
    // Content (JSON schema for page sections)
    content: text('content').default('{}'),
    
    // SEO
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    ogImage: text('og_image'),
    
    // Conversion
    conversionGoal: text('conversion_goal', {
        enum: ['lead', 'trial', 'enrollment', 'waitlist', 'contact']
    }),
    formSlug: text('form_slug'),  // Which form to use
    
    // Status
    status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
    publishedAt: integer('published_at'),
    
    // Analytics
    viewCount: integer('view_count').default(0),
    conversionCount: integer('conversion_count').default(0),
    
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_landing_slug').on(table.organizationId, table.slug),
]);
```

---

## Implementation Checklist

### Phase 1: Schema
- [ ] Add `organizationBranding` table
- [ ] Add `organizationDomains` table  
- [ ] Add `landingPages` table
- [ ] Run migration

### Phase 2: Branding Infrastructure
- [ ] Create `ThemeProvider` component
- [ ] Create color scale generator
- [ ] Create font loader (Google Fonts)
- [ ] Create branding context hooks

### Phase 3: Public Layout
- [ ] Create public layout shell
- [ ] Create `Header` component (with org branding)
- [ ] Create `Footer` component (with powered by)
- [ ] Create navigation for public pages

### Phase 4: Core Public Pages
- [ ] School landing page template
- [ ] About page
- [ ] Contact page with form
- [ ] Terms & Privacy pages

### Phase 5: Module-Gated Pages
- [ ] Course catalog & landing pages (Pedagogical)
- [ ] Lead forms (Marketing)
- [ ] Blog/content (Marketing)
- [ ] Careers (HR/Talent)
- [ ] Events (Operations)
- [ ] Certificate verification (Pedagogical)

### Phase 6: Custom Domains
- [ ] Domain verification flow
- [ ] Middleware domain resolution
- [ ] SSL automation (via Vercel/Cloudflare)
- [ ] DNS instructions UI
