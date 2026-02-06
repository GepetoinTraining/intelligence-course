/**
 * QR Code System Types
 * Used for generating branded QR codes for marketing materials
 */

export type ModuleStyle = 'square' | 'rounded' | 'circle';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QRBrandingOptions {
    /** Primary color for QR modules (hex format: #RRGGBB) */
    primaryColor?: string;
    /** Background color (hex format: #RRGGBB) */
    backgroundColor?: string;
    /** Module/dot style */
    moduleStyle?: ModuleStyle;
    /** Path or URL to logo image (will be embedded in center) */
    logoUrl?: string;
    /** Logo size as percentage of QR width (0.15 - 0.30 recommended) */
    logoSizeRatio?: number;
    /** Text label to display below QR code */
    frameText?: string;
    /** Frame text font size in pixels */
    frameTextSize?: number;
    /** Frame text color (defaults to primaryColor) */
    frameTextColor?: string;
}

export interface QRGenerateOptions extends QRBrandingOptions {
    /** Data to encode in QR code */
    data: string;
    /** Output width in pixels (height auto-calculated) */
    width?: number;
    /** Error correction level (H recommended when using logo) */
    errorCorrectionLevel?: ErrorCorrectionLevel;
    /** Output format */
    format?: 'png' | 'svg' | 'base64';
}

export interface QRGenerateResult {
    /** Generated image as Buffer, SVG string, or base64 */
    image: Buffer | string;
    /** MIME type of the output */
    mimeType: string;
    /** Actual dimensions */
    width: number;
    height: number;
}

// vCard types
export interface VCardData {
    fullName: string;
    organization?: string;
    title?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

// Trackable QR for marketing
export interface TrackableQROptions extends QRBrandingOptions {
    /** Organization ID */
    organizationId: string;
    /** Unique code for URL routing */
    code: string;
    /** Human-readable name */
    name: string;
    /** Campaign to attribute to */
    campaignId?: string;
    /** Partner to attribute to */
    partnerId?: string;
    /** Event to attribute to */
    eventId?: string;
    /** Physical location info */
    location?: {
        name: string;
        type: 'school' | 'partner' | 'event' | 'public' | 'flyer' | 'poster' | 'banner' | 'vehicle' | 'other';
        address?: string;
        neighborhood?: string;
        city?: string;
        coordinates?: { lat: number; lng: number };
    };
    /** Destination after scan */
    destination: {
        type: 'landing_page' | 'form' | 'whatsapp' | 'link' | 'vcard' | 'app';
        url?: string;
        landingPageId?: string;
        formSlug?: string;
    };
    /** UTM parameters to append */
    utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
        content?: string;
        term?: string;
    };
}

// Brand defaults (NodeZero branding)
export const BRAND_DEFAULTS = {
    primaryColor: '#7048e8',       // Violet (primary brand color)
    backgroundColor: '#FFFFFF',
    secondaryColor: '#1B2B34',
    moduleStyle: 'rounded' as ModuleStyle,
    errorCorrectionLevel: 'H' as ErrorCorrectionLevel,
    logoSizeRatio: 0.25,
    frameTextSize: 24,
    width: 400,
} as const;

