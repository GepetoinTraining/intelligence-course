/**
 * Single Job Page with Application
 * 
 * View job details and start pre-interview
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import for visualization
const SkillRadar = dynamic(
    () => import('@/components/lattice/SkillRadar'),
    { ssr: false }
);

interface Job {
    id: string;
    title: string;
    description: string;
    company: string;
    postedAt: number;
    skillSummary: {
        mustHaveSkills: string[];
        categoryFocus: string[];
        overallProfile: string;
    } | null;
    canApply: boolean;
}

interface Message {
    role: 'assistant' | 'user';
    content: string;
    timestamp: string;
}

interface MatchResult {
    score: number;
    gaps: Array<{ skillId: string; gap: number; severity: string }>;
    shadowWarnings: string[];
    strengths: string[];
}

type AppStage = 'view' | 'form' | 'interview' | 'complete';

export default function JobPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [stage, setStage] = useState<AppStage>('view');

    // Application state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{
        profile: { summary: string; keyStrengths: string[]; potentialConcerns: string[] };
        match: MatchResult | null;
        lattice: any;
    } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchJob();
    }, [jobId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchJob() {
        try {
            const res = await fetch(`/api/careers/${jobId}`);
            const data = await res.json();
            if (data.success) {
                setJob(data.job);
            }
        } catch (error) {
            console.error('Failed to fetch job:', error);
        } finally {
            setLoading(false);
        }
    }

    async function startInterview() {
        if (!name.trim() || !email.trim()) return;

        setSending(true);
        try {
            const res = await fetch(`/api/careers/${jobId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'start',
                    candidateName: name,
                    candidateEmail: email,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setMessages([{
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toISOString(),
                }]);
                setStage('interview');
            }
        } catch (error) {
            console.error('Failed to start interview:', error);
        } finally {
            setSending(false);
        }
    }

    async function sendMessage() {
        if (!inputValue.trim() || sending) return;

        const userMessage: Message = {
            role: 'user',
            content: inputValue,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setSending(true);

        try {
            const res = await fetch(`/api/careers/${jobId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'continue',
                    messages: [...messages, userMessage],
                    response: userMessage.content,
                }),
            });

            const data = await res.json();
            if (data.success) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, assistantMessage]);

                if (data.isComplete) {
                    // Complete the interview
                    await completeInterview([...messages, userMessage, assistantMessage]);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    }

    async function completeInterview(finalMessages: Message[]) {
        try {
            const res = await fetch(`/api/careers/${jobId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'complete',
                    messages: finalMessages,
                    candidateName: name,
                    candidateEmail: email,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setResult({
                    profile: data.profile,
                    match: data.match,
                    lattice: data.profile.lattice,
                });
                setStage('complete');
            }
        } catch (error) {
            console.error('Failed to complete interview:', error);
        }
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
            }}>
                Loading...
            </div>
        );
    }

    if (!job) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                padding: 24,
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h1 style={{ marginBottom: 16 }}>Job Not Found</h1>
                <Link href="/careers" style={{ color: '#A78BFA' }}>
                    ← Back to Careers
                </Link>
            </div>
        );
    }

    // Results View
    if (stage === 'complete' && result) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
                padding: 24,
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <Link href="/careers" style={{ color: '#A78BFA', fontSize: 14 }}>
                        ← Back to Careers
                    </Link>

                    <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 48 }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                        <h1 style={{ color: 'white', fontSize: 32, marginBottom: 8 }}>
                            Interview Complete!
                        </h1>
                        <p style={{ color: '#9CA3AF' }}>
                            Here's your skill profile for {job.title}
                        </p>
                    </div>

                    {/* Match Score */}
                    {result.match && (
                        <div style={{
                            padding: 32,
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                            borderRadius: 16,
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            textAlign: 'center',
                            marginBottom: 32,
                        }}>
                            <div style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 8 }}>
                                Match Score
                            </div>
                            <div style={{
                                fontSize: 64,
                                fontWeight: 800,
                                color: result.match.score >= 70 ? '#4ade80' :
                                    result.match.score >= 50 ? '#fbbf24' : '#f87171',
                            }}>
                                {result.match.score}
                            </div>
                            <div style={{ color: '#6B7280', fontSize: 14 }}>/ 100</div>
                        </div>
                    )}

                    {/* Summary */}
                    <div style={{
                        padding: 24,
                        background: 'rgba(30, 30, 50, 0.7)',
                        borderRadius: 16,
                        marginBottom: 24,
                    }}>
                        <h3 style={{ color: 'white', marginBottom: 12 }}>Profile Summary</h3>
                        <p style={{ color: '#9CA3AF', lineHeight: 1.8 }}>
                            {result.profile.summary}
                        </p>
                    </div>

                    {/* Strengths & Concerns */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: 24,
                        marginBottom: 32,
                    }}>
                        <div style={{
                            padding: 24,
                            background: 'rgba(30, 30, 50, 0.7)',
                            borderRadius: 16,
                        }}>
                            <h3 style={{ color: '#4ade80', marginBottom: 16 }}>✨ Key Strengths</h3>
                            <ul style={{ color: '#9CA3AF', margin: 0, paddingLeft: 20 }}>
                                {result.profile.keyStrengths.map((s, i) => (
                                    <li key={i} style={{ marginBottom: 8 }}>{s}</li>
                                ))}
                            </ul>
                        </div>

                        {result.profile.potentialConcerns.length > 0 && (
                            <div style={{
                                padding: 24,
                                background: 'rgba(30, 30, 50, 0.7)',
                                borderRadius: 16,
                            }}>
                                <h3 style={{ color: '#fbbf24', marginBottom: 16 }}>💡 Growth Areas</h3>
                                <ul style={{ color: '#9CA3AF', margin: 0, paddingLeft: 20 }}>
                                    {result.profile.potentialConcerns.map((c, i) => (
                                        <li key={i} style={{ marginBottom: 8 }}>{c}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Skill Radar */}
                    {result.lattice && (
                        <div style={{
                            padding: 24,
                            background: 'rgba(30, 30, 50, 0.7)',
                            borderRadius: 16,
                            marginBottom: 32,
                        }}>
                            <h3 style={{ color: 'white', marginBottom: 16, textAlign: 'center' }}>
                                Your Skill Lattice
                            </h3>
                            <SkillRadar shapeData={result.lattice} size={400} />
                        </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <Link href="/careers">
                            <button style={{
                                padding: '16px 32px',
                                background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}>
                                Explore More Positions
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Interview Chat View
    if (stage === 'interview') {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
                    background: 'rgba(10, 10, 18, 0.9)',
                }}>
                    <h2 style={{ color: 'white', fontSize: 18, margin: 0 }}>
                        Interview for {job.title}
                    </h2>
                    <p style={{ color: '#9CA3AF', fontSize: 14, margin: '4px 0 0' }}>
                        {job.company}
                    </p>
                </div>

                {/* Messages */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 24,
                }}>
                    <div style={{ maxWidth: 700, margin: '0 auto' }}>
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: 16,
                                }}
                            >
                                <div style={{
                                    maxWidth: '80%',
                                    padding: '12px 16px',
                                    borderRadius: 16,
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #8B5CF6, #6366F1)'
                                        : 'rgba(30, 30, 50, 0.7)',
                                    color: 'white',
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {sending && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                marginBottom: 16,
                            }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: 16,
                                    background: 'rgba(30, 30, 50, 0.7)',
                                    color: '#9CA3AF',
                                }}>
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input */}
                <div style={{
                    padding: 24,
                    borderTop: '1px solid rgba(139, 92, 246, 0.2)',
                    background: 'rgba(10, 10, 18, 0.9)',
                }}>
                    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 12 }}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type your response..."
                            disabled={sending}
                            style={{
                                flex: 1,
                                padding: '14px 20px',
                                borderRadius: 12,
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                background: 'rgba(30, 30, 50, 0.8)',
                                color: 'white',
                                fontSize: 16,
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={sending || !inputValue.trim()}
                            style={{
                                padding: '14px 24px',
                                borderRadius: 12,
                                border: 'none',
                                background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                                color: 'white',
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: sending ? 'not-allowed' : 'pointer',
                                opacity: sending ? 0.7 : 1,
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Application Form View
    if (stage === 'form') {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
                padding: 24,
            }}>
                <div style={{ maxWidth: 500, margin: '0 auto', paddingTop: 60 }}>
                    <button
                        onClick={() => setStage('view')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#A78BFA',
                            cursor: 'pointer',
                            marginBottom: 24,
                        }}
                    >
                        ← Back to Job Details
                    </button>

                    <h1 style={{ color: 'white', fontSize: 28, marginBottom: 8 }}>
                        Apply for {job.title}
                    </h1>
                    <p style={{ color: '#9CA3AF', marginBottom: 32 }}>
                        Let's start with your basics, then we'll have a quick chat to learn about your skills.
                    </p>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ color: 'white', display: 'block', marginBottom: 8 }}>
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full name"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 12,
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                background: 'rgba(30, 30, 50, 0.8)',
                                color: 'white',
                                fontSize: 16,
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <label style={{ color: 'white', display: 'block', marginBottom: 8 }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 12,
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                background: 'rgba(30, 30, 50, 0.8)',
                                color: 'white',
                                fontSize: 16,
                                outline: 'none',
                            }}
                        />
                    </div>

                    <button
                        onClick={startInterview}
                        disabled={!name.trim() || !email.trim() || sending}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                            color: 'white',
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: (!name.trim() || !email.trim() || sending) ? 'not-allowed' : 'pointer',
                            opacity: (!name.trim() || !email.trim() || sending) ? 0.7 : 1,
                        }}
                    >
                        {sending ? 'Starting Interview...' : 'Start Interview →'}
                    </button>

                    <p style={{
                        color: '#6B7280',
                        fontSize: 12,
                        textAlign: 'center',
                        marginTop: 16,
                    }}>
                        Takes about 5-10 minutes. Your responses build your skill profile.
                    </p>
                </div>
            </div>
        );
    }

    // Job Details View
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
            padding: 24,
        }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <Link href="/careers" style={{ color: '#A78BFA', fontSize: 14 }}>
                    ← Back to Careers
                </Link>

                <div style={{ marginTop: 32 }}>
                    <span style={{
                        color: '#A78BFA',
                        fontSize: 14,
                        marginBottom: 8,
                        display: 'block',
                    }}>
                        {job.company}
                    </span>
                    <h1 style={{
                        color: 'white',
                        fontSize: 36,
                        fontWeight: 700,
                        marginBottom: 16,
                    }}>
                        {job.title}
                    </h1>

                    <div style={{
                        padding: 32,
                        background: 'rgba(30, 30, 50, 0.7)',
                        borderRadius: 16,
                        marginBottom: 24,
                    }}>
                        <h3 style={{ color: 'white', marginBottom: 16 }}>About This Role</h3>
                        <p style={{ color: '#9CA3AF', lineHeight: 1.8 }}>
                            {job.skillSummary?.overallProfile || job.description || 'No description available.'}
                        </p>
                    </div>

                    {job.skillSummary && job.skillSummary.categoryFocus.length > 0 && (
                        <div style={{
                            padding: 24,
                            background: 'rgba(30, 30, 50, 0.7)',
                            borderRadius: 16,
                            marginBottom: 32,
                        }}>
                            <h3 style={{ color: 'white', marginBottom: 16 }}>Key Skill Areas</h3>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {job.skillSummary.categoryFocus.map((cat, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'rgba(139, 92, 246, 0.2)',
                                            borderRadius: 20,
                                            color: '#A78BFA',
                                            fontSize: 14,
                                        }}
                                    >
                                        {cat.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {job.canApply && (
                        <button
                            onClick={() => setStage('form')}
                            style={{
                                width: '100%',
                                padding: '18px',
                                borderRadius: 12,
                                border: 'none',
                                background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                                color: 'white',
                                fontSize: 18,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginBottom: 16,
                            }}
                        >
                            Apply Now — Start Pre-Interview
                        </button>
                    )}

                    <p style={{
                        color: '#6B7280',
                        fontSize: 14,
                        textAlign: 'center',
                    }}>
                        5-10 minute AI interview • Instant skill profile • See your match score
                    </p>
                </div>
            </div>
        </div>
    );
}
