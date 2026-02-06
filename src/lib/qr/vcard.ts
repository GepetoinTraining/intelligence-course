/**
 * vCard Encoding Utility
 * Generates vCard 3.0 format strings for QR codes
 */

import { VCardData } from './types';

/**
 * Generate a vCard 3.0 string from contact data
 */
export function generateVCard(contact: VCardData): string {
    const lines: string[] = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCardValue(contact.fullName)}`,
        `N:${parseNameParts(contact.fullName)}`,
    ];

    if (contact.organization) {
        lines.push(`ORG:${escapeVCardValue(contact.organization)}`);
    }

    if (contact.title) {
        lines.push(`TITLE:${escapeVCardValue(contact.title)}`);
    }

    if (contact.email) {
        lines.push(`EMAIL;TYPE=WORK:${contact.email}`);
    }

    if (contact.phone) {
        lines.push(`TEL;TYPE=WORK:${formatPhone(contact.phone)}`);
    }

    if (contact.website) {
        lines.push(`URL:${contact.website}`);
    }

    if (contact.address) {
        const addr = contact.address;
        // ADR format: PO Box;Extended;Street;City;State;PostalCode;Country
        const addrParts = [
            '', // PO Box
            '', // Extended
            addr.street || '',
            addr.city || '',
            addr.state || '',
            addr.postalCode || '',
            addr.country || 'Brasil',
        ];
        lines.push(`ADR;TYPE=WORK:${addrParts.map(escapeVCardValue).join(';')}`);
    }

    lines.push('END:VCARD');

    return lines.join('\r\n');
}

/**
 * Parse full name into vCard N field format
 * N format: Last;First;Middle;Prefix;Suffix
 */
function parseNameParts(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
        return `${parts[0]};;;;`;
    }

    const lastName = parts[parts.length - 1];
    const firstName = parts[0];
    const middleName = parts.slice(1, -1).join(' ');

    return `${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};${escapeVCardValue(middleName)};;`;
}

/**
 * Format phone number for vCard
 * Ensures Brazilian format: +55 XX XXXXX-XXXX
 */
function formatPhone(phone: string): string {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');

    // Add Brazil country code if not present
    if (digits.length === 11) {
        return `+55${digits}`;
    } else if (digits.length === 10) {
        // Old format without 9, add 9 prefix
        const ddd = digits.substring(0, 2);
        const number = digits.substring(2);
        return `+55${ddd}9${number}`;
    } else if (digits.startsWith('55') && digits.length === 13) {
        return `+${digits}`;
    }

    return phone; // Return as-is if format unknown
}

/**
 * Escape special characters for vCard
 */
function escapeVCardValue(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

/**
 * Create a WhatsApp link with pre-filled message
 */
export function createWhatsAppLink(
    phone: string,
    message?: string
): string {
    const digits = phone.replace(/\D/g, '');
    const cleanPhone = digits.startsWith('55') ? digits : `55${digits}`;

    let url = `https://wa.me/${cleanPhone}`;

    if (message) {
        url += `?text=${encodeURIComponent(message)}`;
    }

    return url;
}

