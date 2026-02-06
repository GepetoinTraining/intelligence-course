import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// GET /api/memory/snr/[content] - Calculate SNR for content
// Note: This is a utility endpoint for evaluating content quality
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const content = searchParams.get('content');

    if (!content) {
        return NextResponse.json({ error: 'Content parameter required' }, { status: 400 });
    }

    try {
        // Calculate various signal/noise metrics
        const words = content.split(/\s+/).filter(w => w.length > 0);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Signal indicators (meaningful content)
        const signalIndicators = {
            hasNumbers: /\d/.test(content),
            hasProperNouns: /\b[A-Z][a-z]+\b/.test(content),
            hasSpecificTerms: /\b(because|therefore|however|specifically|importantly)\b/i.test(content),
            hasDates: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(content),
            hasEmotionalMarkers: /\b(feel|felt|love|hate|afraid|happy|sad|angry|excited)\b/i.test(content),
        };

        const signalCount = Object.values(signalIndicators).filter(Boolean).length;

        // Noise indicators (filler content)
        const noiseIndicators = {
            hasFillerWords: /\b(um|uh|like|you know|basically|actually|literally)\b/i.test(content),
            hasRepetition: /((\b\w+\b)\s+\2\s*)+/i.test(content),
            tooGeneric: words.length < 10 && !signalIndicators.hasSpecificTerms,
            lowInformationDensity: words.length / Math.max(sentences.length, 1) < 5,
        };

        const noiseCount = Object.values(noiseIndicators).filter(Boolean).length;

        // Calculate SNR (0-1 scale)
        const rawSnr = (signalCount + 1) / (noiseCount + 1);
        const normalizedSnr = Math.min(1, rawSnr / 3); // Normalize to 0-1

        // Determine gravity recommendation
        let gravityRecommendation: number;
        if (normalizedSnr > 0.618) {
            gravityRecommendation = 0.8 + (normalizedSnr - 0.618) * 0.5; // High value
        } else if (normalizedSnr > 0.382) {
            gravityRecommendation = 0.5 + (normalizedSnr - 0.382) * 0.6; // Medium value
        } else {
            gravityRecommendation = normalizedSnr * 1.3; // Low value, near noise floor
        }

        gravityRecommendation = Math.min(1, Math.max(0, gravityRecommendation));

        return NextResponse.json({
            data: {
                snr: normalizedSnr,
                signalScore: signalCount,
                noiseScore: noiseCount,
                signalIndicators,
                noiseIndicators,
                gravityRecommendation,
                analysis: {
                    wordCount: words.length,
                    sentenceCount: sentences.length,
                    avgWordsPerSentence: words.length / Math.max(sentences.length, 1),
                },
                verdict: normalizedSnr > 0.618 ? 'high_signal' :
                    normalizedSnr > 0.382 ? 'moderate_signal' : 'low_signal'
            }
        });
    } catch (error) {
        console.error('Error calculating SNR:', error);
        return NextResponse.json({ error: 'Failed to calculate SNR' }, { status: 500 });
    }
}

