/**
 * Página do Talent Pool - Cadastre-se sem vaga específica
 * 
 * Candidatos podem construir seu lattice de competências para serem descobertos por empregadores
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import for visualization
const SkillRadar = dynamic(
    () => import('@/components/lattice/SkillRadar'),
    { ssr: false }
);

interface Message {
    role: 'assistant' | 'user';
    content: string;
    timestamp: string;
}

type Stage = 'intro' | 'form' | 'interview' | 'complete';

export default function TalentPoolPage() {
    const [stage, setStage] = useState<Stage>('intro');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{
        profile: { summary: string; keyStrengths: string[]; potentialConcerns: string[] };
        lattice: any;
    } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function startInterview() {
        if (!name.trim() || !email.trim()) return;

        setSending(true);
        try {
            const res = await fetch('/api/careers/talent-pool', {
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
            const res = await fetch('/api/careers/talent-pool', {
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
            const res = await fetch('/api/careers/talent-pool', {
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
                    lattice: data.profile.lattice,
                });
                setStage('complete');
            }
        } catch (error) {
            console.error('Failed to complete interview:', error);
        }
    }

    // Complete View - Show Results
    if (stage === 'complete' && result) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
                padding: 24,
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <Link href="/careers" style={{ color: '#A78BFA', fontSize: 14 }}>
                        ← Ver Vagas Abertas
                    </Link>

                    <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 48 }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
                        <h1 style={{ color: 'white', fontSize: 32, marginBottom: 8 }}>
                            Seu Perfil de Competências está Pronto!
                        </h1>
                        <p style={{ color: '#9CA3AF' }}>
                            Você agora está no Talent Pool. Empregadores podem te descobrir com base nas suas competências.
                        </p>
                    </div>

                    {/* Summary */}
                    <div style={{
                        padding: 24,
                        background: 'rgba(30, 30, 50, 0.7)',
                        borderRadius: 16,
                        marginBottom: 24,
                    }}>
                        <h3 style={{ color: 'white', marginBottom: 12 }}>Resumo do Perfil</h3>
                        <p style={{ color: '#9CA3AF', lineHeight: 1.8 }}>
                            {result.profile.summary}
                        </p>
                    </div>

                    {/* Strengths & Potential */}
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
                            <h3 style={{ color: '#4ade80', marginBottom: 16 }}>✨ Pontos Fortes</h3>
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
                                <h3 style={{ color: '#fbbf24', marginBottom: 16 }}>💡 Oportunidades de Crescimento</h3>
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
                                Seu Lattice de Competências
                            </h3>
                            <SkillRadar shapeData={result.lattice} size={400} />
                        </div>
                    )}

                    <div style={{
                        padding: 24,
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                        borderRadius: 16,
                        textAlign: 'center',
                        marginBottom: 24,
                    }}>
                        <h3 style={{ color: 'white', marginBottom: 8 }}>🎉 Pronto para Salvar seu Perfil?</h3>
                        <p style={{ color: '#9CA3AF', marginBottom: 16 }}>
                            Crie uma conta para salvar seu perfil, enviar documentos comprobatórios e ser descoberto por empregadores!
                        </p>
                        <Link href={`/sign-up?role=talent&email=${encodeURIComponent(email)}`}>
                            <button style={{
                                padding: '16px 32px',
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 18,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginRight: 12,
                            }}>
                                Criar Conta Grátis 🚀
                            </button>
                        </Link>
                    </div>

                    <div style={{
                        padding: 24,
                        background: 'rgba(30, 30, 50, 0.5)',
                        borderRadius: 16,
                        textAlign: 'center',
                        marginBottom: 32,
                    }}>
                        <p style={{ color: '#9CA3AF', marginBottom: 16 }}>
                            Ou navegue pelas vagas abertas para ver como suas competências se encaixam!
                        </p>
                        <Link href="/careers">
                            <button style={{
                                padding: '14px 28px',
                                background: 'transparent',
                                color: '#A78BFA',
                                border: '1px solid #A78BFA',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}>
                                Ver Vagas Abertas
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Interview View
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
                        Entrevista Talent Pool
                    </h2>
                    <p style={{ color: '#9CA3AF', fontSize: 14, margin: '4px 0 0' }}>
                        Construindo seu perfil de competências
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
                                    Pensando...
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
                            placeholder="Compartilhe sua experiência..."
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
                            Enviar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Form View
    if (stage === 'form') {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
                padding: 24,
            }}>
                <div style={{ maxWidth: 500, margin: '0 auto', paddingTop: 60 }}>
                    <button
                        onClick={() => setStage('intro')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#A78BFA',
                            cursor: 'pointer',
                            marginBottom: 24,
                        }}
                    >
                        ← Voltar
                    </button>

                    <h1 style={{ color: 'white', fontSize: 28, marginBottom: 8 }}>
                        Entrar no Talent Pool
                    </h1>
                    <p style={{ color: '#9CA3AF', marginBottom: 32 }}>
                        Vamos começar com o básico, depois teremos uma conversa para entender suas competências.
                    </p>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ color: 'white', display: 'block', marginBottom: 8 }}>
                            Seu Nome
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome completo"
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
                            Endereço de Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="voce@exemplo.com"
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
                        {sending ? 'Iniciando...' : 'Iniciar Entrevista de Perfil →'}
                    </button>

                    <p style={{
                        color: '#6B7280',
                        fontSize: 12,
                        textAlign: 'center',
                        marginTop: 16,
                    }}>
                        Leva cerca de 5-10 minutos. Seu perfil ajuda empregadores a te encontrar.
                    </p>
                </div>
            </div>
        );
    }

    // Intro View
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
        }}>
            {/* Hero */}
            <div style={{
                padding: '80px 24px 60px',
                textAlign: 'center',
                background: 'radial-gradient(ellipse at center top, rgba(139, 92, 246, 0.15), transparent 70%)',
            }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🌟</div>
                <h1 style={{
                    fontSize: 42,
                    fontWeight: 800,
                    color: 'white',
                    marginBottom: 16,
                    background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Entre no Talent Pool
                </h1>
                <p style={{
                    fontSize: 18,
                    color: '#9CA3AF',
                    maxWidth: 500,
                    margin: '0 auto 32px',
                    lineHeight: 1.6,
                }}>
                    Construa seu perfil de competências e deixe os melhores empregadores te descobrirem.
                    Sem currículo — apenas uma conversa.
                </p>

                <button
                    onClick={() => setStage('form')}
                    style={{
                        padding: '18px 36px',
                        fontSize: 18,
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                        marginBottom: 16,
                    }}
                >
                    Criar Meu Perfil
                </button>

                <p style={{ color: '#6B7280', fontSize: 14 }}>
                    5-10 min de entrevista • Análise de competências com IA • Seja encontrado
                </p>
            </div>

            {/* How It Works */}
            <div style={{
                padding: '48px 24px',
                maxWidth: 900,
                margin: '0 auto',
            }}>
                <h2 style={{ color: 'white', textAlign: 'center', marginBottom: 32 }}>
                    Como Funciona
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 24,
                }}>
                    <div style={{
                        padding: 24,
                        background: 'rgba(30, 30, 50, 0.5)',
                        borderRadius: 16,
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                        <h3 style={{ color: 'white', marginBottom: 8 }}>1. Tenha uma Conversa</h3>
                        <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>
                            Responda algumas perguntas sobre sua experiência, competências e estilo de trabalho.
                        </p>
                    </div>
                    <div style={{
                        padding: 24,
                        background: 'rgba(30, 30, 50, 0.5)',
                        borderRadius: 16,
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                        <h3 style={{ color: 'white', marginBottom: 8 }}>2. Receba seu Lattice</h3>
                        <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>
                            Analisamos suas respostas e mapeamos suas 45 competências em 9 categorias.
                        </p>
                    </div>
                    <div style={{
                        padding: 24,
                        background: 'rgba(30, 30, 50, 0.5)',
                        borderRadius: 16,
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
                        <h3 style={{ color: 'white', marginBottom: 8 }}>3. Seja Descoberto</h3>
                        <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>
                            Empregadores procurando suas competências podem te encontrar e entrar em contato.
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div style={{
                padding: '48px 24px 80px',
                textAlign: 'center',
            }}>
                <button
                    onClick={() => setStage('form')}
                    style={{
                        padding: '16px 32px',
                        fontSize: 16,
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                    }}
                >
                    Começar Agora — É Grátis
                </button>

                <p style={{ color: '#6B7280', fontSize: 14, marginTop: 16 }}>
                    Já tem um perfil?{' '}
                    <Link href="/careers" style={{ color: '#A78BFA' }}>
                        Ver vagas abertas
                    </Link>
                </p>
            </div>
        </div>
    );
}

