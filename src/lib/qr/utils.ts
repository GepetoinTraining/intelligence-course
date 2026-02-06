/**
 * QR Code Utility Functions
 */

import crypto from 'crypto';

/**
 * Converts hex color string to RGB tuple
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleanHex = hex.replace('#', '');

    if (cleanHex.length !== 6) {
        throw new Error(`Invalid hex color format: ${hex}`);
    }

    return {
        r: parseInt(cleanHex.substring(0, 2), 16),
        g: parseInt(cleanHex.substring(2, 4), 16),
        b: parseInt(cleanHex.substring(4, 6), 16),
    };
}

/**
 * Converts RGB to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Generates a short unique code for QR tracking
 * Format: 6 alphanumeric characters
 */
export function generateShortCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generates a book/product serial number
 * Format: BATCH-YYYYMMDDHHMMSS-NNNN-CHECKSUM
 */
export function generateSerial(batchId: string, sequenceNum: number): string {
    const timestamp = new Date().toISOString()
        .replace(/[-:T]/g, '')
        .substring(0, 14);

    const seq = sequenceNum.toString().padStart(4, '0');

    const checksumInput = `${batchId}${timestamp}${seq}`;
    const checksum = crypto
        .createHash('sha256')
        .update(checksumInput)
        .digest('hex')
        .substring(0, 4)
        .toUpperCase();

    return `${batchId}-${timestamp}-${seq}-${checksum}`;
}

/**
 * Validates a serial number format
 */
export function isValidSerial(serial: string): boolean {
    const pattern = /^[A-Z0-9]+-\d{14}-\d{4}-[A-F0-9]{4}$/;
    return pattern.test(serial);
}

/**
 * Encodes data to base64 URL-safe format
 */
export function base64UrlEncode(data: string): string {
    return Buffer.from(data)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Decodes base64 URL-safe format
 */
export function base64UrlDecode(encoded: string): string {
    const base64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Generates MD5 hash (for filenames)
 */
export function md5Hash(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
}

/**
 * Builds a tracking URL with UTM parameters
 */
export function buildTrackingUrl(
    baseUrl: string,
    params: {
        qrCode?: string;
        source?: string;
        medium?: string;
        campaign?: string;
        content?: string;
        term?: string;
    }
): string {
    const url = new URL(baseUrl);

    if (params.qrCode) url.searchParams.set('qr', params.qrCode);
    if (params.source) url.searchParams.set('utm_source', params.source);
    if (params.medium) url.searchParams.set('utm_medium', params.medium);
    if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
    if (params.content) url.searchParams.set('utm_content', params.content);
    if (params.term) url.searchParams.set('utm_term', params.term);

    return url.toString();
}

/**
 * Escape XML special characters for SVG
 */
export function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Parse user agent to extract device info
 */
export function parseUserAgent(userAgent: string): {
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
} {
    const ua = userAgent.toLowerCase();

    // Device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/mobile|android|iphone|ipod/.test(ua) && !/ipad|tablet/.test(ua)) {
        deviceType = 'mobile';
    } else if (/ipad|tablet|playbook|silk/.test(ua)) {
        deviceType = 'tablet';
    }

    // Browser
    let browser = 'other';
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
    else if (ua.includes('firefox')) browser = 'firefox';
    else if (ua.includes('edg')) browser = 'edge';
    else if (ua.includes('opera')) browser = 'opera';

    // OS
    let os = 'other';
    if (ua.includes('windows')) os = 'windows';
    else if (ua.includes('mac')) os = 'macos';
    else if (ua.includes('linux')) os = 'linux';
    else if (ua.includes('android')) os = 'android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'ios';

    return { deviceType, browser, os };
}

