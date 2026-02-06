/**
 * Lattice Demo Page
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { SkillRadar } from '@/components/lattice/SkillRadar';
import { LatticeCV } from '@/components/lattice/LatticeCV';
import type { ShapeData } from '@/lib/lattice/schemas';

const LatticeViewer = dynamic(
    () => import('@/components/lattice/LatticeViewer'),
    {
        ssr: false,
        loading: () => (
            <div style={{
                height: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1a1a2e',
                borderRadius: 12,
                color: '#9CA3AF'
            }}>
                Loading 3D...
            </div>
        )
    }
);

const DEMO_DATA: ShapeData = {
    positions: {
        comm_verbal: 1.8, comm_written: 1.5, comm_nonverbal: 0.8,
        comm_assertive: 1.2, comm_digital: 1.9, comm_effective: 1.6,
        adapt_change: 0.9, adapt_pivoting: 1.4, adapt_creative_problem: 2.0,
        adapt_critical_thinking: 1.7, adapt_resilience: 0.5,
        div_cross_cultural: 0.6, div_generational: 0.3,
        div_inclusive_comm: 0.8, div_org_navigation: -0.2,
        smd_personal_branding: 1.5, smd_reputation: 0.9, smd_networking: 1.2,
        smd_privacy: 0.4, smd_content: 1.8,
        eq_self_awareness: 1.1, eq_regulation: 0.6, eq_empathy: 1.4,
        eq_social_skills: 1.3, eq_conflict: -0.8,
        tm_prioritization: 0.7, tm_goal_setting: 1.0, tm_focus: -0.5,
        tm_interruption: -0.3, tm_procrastination: -1.2,
        net_relationship_building: 1.6, net_mentorship: 1.9, net_cultivation: 1.1,
        net_partnerships: 0.8, net_recognition: 0.5,
        cl_trend_awareness: 1.4, cl_feedback: 1.0, cl_self_evaluation: 0.9,
        cl_learning_plans: 0.3, cl_adaptation: 1.2,
        lr_traversal: 1.8, lr_decomposition: 1.9, lr_abstraction: 2.0,
        lr_analogy: 1.5, lr_sequencing: 1.3,
    },
    categoryScores: {
        communication: 1.47, adaptability: 1.3, diversity_understanding: 0.38,
        social_media_digital: 1.16, emotional_intelligence: 0.72,
        time_management: -0.06, networking: 1.18,
        continuous_learning: 0.96, logic_reasoning: 1.7,
    },
    overallScore: 78,
    totalEvidenceCount: 247,
    shadowRegions: [],
};

export default function LatticeDemoPage() {
    const [view, setView] = useState<'3d' | 'radar' | 'cv'>('radar');

    const buttonStyle = (active: boolean) => ({
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        background: active ? '#8B5CF6' : '#374151',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 600,
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
            padding: 32,
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <h1 style={{ color: 'white', fontSize: 32, marginBottom: 8, fontWeight: 700 }}>
                    Lattice HR Demo
                </h1>
                <p style={{ color: '#9CA3AF', marginBottom: 24 }}>
                    Evidence-based skill visualization
                </p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    <button onClick={() => setView('radar')} style={buttonStyle(view === 'radar')}>
                        📊 Radar
                    </button>
                    <button onClick={() => setView('3d')} style={buttonStyle(view === '3d')}>
                        🎮 3D View
                    </button>
                    <button onClick={() => setView('cv')} style={buttonStyle(view === 'cv')}>
                        📄 CV Export
                    </button>
                </div>

                {view === 'cv' ? (
                    <LatticeCV
                        shapeData={DEMO_DATA}
                        personName="Alex Johnson"
                        personTitle="Senior Software Engineer"
                        personEmail="alex@example.com"
                        bio="Passionate technologist focused on building scalable systems."
                        projectionName="Senior Developer Role"
                        evidenceHighlights={[
                            { content: 'Led system architecture review', source: 'Workshop', date: 'Jan 2026' },
                            { content: 'Mentored 3 junior developers', source: 'Peer Review', date: 'Dec 2025' },
                        ]}
                    />
                ) : (
                    <div style={{ background: '#1f1f2e', borderRadius: 16, padding: 24, minHeight: 500 }}>
                        {view === 'radar' ? (
                            <SkillRadar shapeData={DEMO_DATA} size={450} />
                        ) : (
                            <div style={{ height: 500 }}>
                                <LatticeViewer shapeData={DEMO_DATA} />
                            </div>
                        )}
                    </div>
                )}

                {view !== 'cv' && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 24, justifyContent: 'center' }}>
                        <div style={{ background: '#1f1f2e', padding: '16px 24px', borderRadius: 12, textAlign: 'center' }}>
                            <div style={{ color: '#4ade80', fontSize: 28, fontWeight: 700 }}>{DEMO_DATA.overallScore}</div>
                            <div style={{ color: '#9CA3AF', fontSize: 12 }}>Fit Score</div>
                        </div>
                        <div style={{ background: '#1f1f2e', padding: '16px 24px', borderRadius: 12, textAlign: 'center' }}>
                            <div style={{ color: '#60A5FA', fontSize: 28, fontWeight: 700 }}>{DEMO_DATA.totalEvidenceCount}</div>
                            <div style={{ color: '#9CA3AF', fontSize: 12 }}>Evidence Points</div>
                        </div>
                        <div style={{ background: '#1f1f2e', padding: '16px 24px', borderRadius: 12, textAlign: 'center' }}>
                            <div style={{ color: '#A78BFA', fontSize: 28, fontWeight: 700 }}>45</div>
                            <div style={{ color: '#9CA3AF', fontSize: 12 }}>Skills Tracked</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

