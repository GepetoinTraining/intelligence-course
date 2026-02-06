/**
 * QR Code Generator Service
 * Server-side QR generation with branding support
 */

import QRCode from 'qrcode';
import sharp from 'sharp';
import {
    QRGenerateOptions,
    QRGenerateResult,
    BRAND_DEFAULTS,
    ModuleStyle
} from './types';
import { hexToRgb, escapeXml } from './utils';

export class QRGenerator {
    private defaults = BRAND_DEFAULTS;

    /**
     * Generate a QR code with optional branding
     */
    async generate(options: QRGenerateOptions): Promise<QRGenerateResult> {
        const {
            data,
            width = this.defaults.width,
            errorCorrectionLevel = this.defaults.errorCorrectionLevel,
            primaryColor = this.defaults.primaryColor,
            backgroundColor = this.defaults.backgroundColor,
            moduleStyle = this.defaults.moduleStyle,
            logoUrl,
            logoSizeRatio = this.defaults.logoSizeRatio,
            frameText,
            frameTextSize = this.defaults.frameTextSize,
            frameTextColor,
            format = 'png',
        } = options;

        // Generate base QR code as PNG buffer
        const qrBuffer = await this.generateBaseQR(data, {
            width,
            errorCorrectionLevel,
            primaryColor,
            backgroundColor,
        });

        let finalImage = sharp(qrBuffer);
        let finalHeight = width;

        // Apply module style (rounded corners effect via post-processing)
        if (moduleStyle !== 'square') {
            finalImage = await this.applyModuleStyle(finalImage, moduleStyle);
        }

        // Embed logo if provided
        if (logoUrl) {
            finalImage = await this.embedLogo(finalImage, logoUrl, width, logoSizeRatio);
        }

        // Add frame text if provided
        if (frameText) {
            const frameHeight = 60;
            finalImage = await this.addFrameText(
                finalImage,
                frameText,
                width,
                frameHeight,
                frameTextSize,
                frameTextColor || primaryColor
            );
            finalHeight += frameHeight;
        }

        // Convert to requested format
        const outputBuffer = await finalImage.png().toBuffer();

        if (format === 'base64') {
            return {
                image: `data:image/png;base64,${outputBuffer.toString('base64')}`,
                mimeType: 'image/png',
                width,
                height: finalHeight,
            };
        }

        if (format === 'svg') {
            // For SVG, regenerate without post-processing
            const svgString = await QRCode.toString(data, {
                type: 'svg',
                width,
                errorCorrectionLevel,
                color: {
                    dark: primaryColor,
                    light: backgroundColor,
                },
            });
            return {
                image: svgString,
                mimeType: 'image/svg+xml',
                width,
                height: width, // SVG doesn't include frame text
            };
        }

        return {
            image: outputBuffer,
            mimeType: 'image/png',
            width,
            height: finalHeight,
        };
    }

    /**
     * Generate base QR code without styling
     */
    private async generateBaseQR(
        data: string,
        options: {
            width: number;
            errorCorrectionLevel: string;
            primaryColor: string;
            backgroundColor: string;
        }
    ): Promise<Buffer> {
        return QRCode.toBuffer(data, {
            width: options.width,
            errorCorrectionLevel: options.errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H',
            color: {
                dark: options.primaryColor,
                light: options.backgroundColor,
            },
            margin: 4,
        });
    }

    /**
     * Apply rounded or circle module style
     */
    private async applyModuleStyle(
        image: sharp.Sharp,
        style: ModuleStyle
    ): Promise<sharp.Sharp> {
        if (style === 'rounded') {
            // Slight blur + threshold creates rounded effect
            return image
                .blur(0.5)
                .threshold(128);
        }

        if (style === 'circle') {
            // More aggressive blur for circular dots
            return image
                .blur(1.2)
                .threshold(140);
        }

        return image;
    }

    /**
     * Embed a logo in the center of the QR code
     */
    private async embedLogo(
        qrImage: sharp.Sharp,
        logoUrl: string,
        qrWidth: number,
        sizeRatio: number
    ): Promise<sharp.Sharp> {
        const logoSize = Math.floor(qrWidth * sizeRatio);

        // Fetch and resize logo
        let logoBuffer: Buffer;

        if (logoUrl.startsWith('http')) {
            const response = await fetch(logoUrl);
            logoBuffer = Buffer.from(await response.arrayBuffer());
        } else if (logoUrl.startsWith('data:')) {
            // Base64 data URL
            const base64Data = logoUrl.split(',')[1];
            logoBuffer = Buffer.from(base64Data, 'base64');
        } else {
            // Local file path
            const fs = await import('fs/promises');
            logoBuffer = await fs.readFile(logoUrl);
        }

        // Resize logo and add white background for visibility
        const resizedLogo = await sharp(logoBuffer)
            .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .png()
            .toBuffer();

        // Get QR image buffer
        const qrBuffer = await qrImage.png().toBuffer();

        // Calculate center position
        const position = Math.floor((qrWidth - logoSize) / 2);

        // Composite logo onto QR
        return sharp(qrBuffer)
            .composite([
                {
                    input: resizedLogo,
                    top: position,
                    left: position,
                },
            ]);
    }

    /**
     * Add text frame below QR code
     */
    private async addFrameText(
        qrImage: sharp.Sharp,
        text: string,
        qrWidth: number,
        frameHeight: number,
        fontSize: number,
        textColor: string
    ): Promise<sharp.Sharp> {
        const rgb = hexToRgb(textColor);

        // Create SVG text overlay
        const svgText = `
            <svg width="${qrWidth}" height="${frameHeight}">
                <rect width="100%" height="100%" fill="white"/>
                <text
                    x="50%"
                    y="50%"
                    font-family="Arial, sans-serif"
                    font-size="${fontSize}px"
                    font-weight="bold"
                    fill="rgb(${rgb.r},${rgb.g},${rgb.b})"
                    text-anchor="middle"
                    dominant-baseline="middle"
                >${escapeXml(text)}</text>
            </svg>
        `;

        const textBuffer = Buffer.from(svgText);
        const qrBuffer = await qrImage.png().toBuffer();

        // Extend canvas and add text
        return sharp(qrBuffer)
            .extend({
                bottom: frameHeight,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            })
            .composite([
                {
                    input: textBuffer,
                    top: qrWidth,
                    left: 0,
                },
            ]);
    }

    /**
     * Batch generate multiple QR codes
     */
    async batchGenerate(
        configs: QRGenerateOptions[]
    ): Promise<QRGenerateResult[]> {
        return Promise.all(configs.map(config => this.generate(config)));
    }
}

// Export singleton instance
export const qrGenerator = new QRGenerator();

