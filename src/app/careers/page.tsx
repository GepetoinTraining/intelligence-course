/**
 * Página de Carreiras - Vagas Públicas
 * 
 * Navegue por vagas abertas com Lattice HR
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Job {
    id: string;
    title: string;
    description: string;
    company: string;
    postedAt: number;
}

export default function CareersPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    async function fetchJobs() {
        try {
            const res = await fetch('/api/careers');
            const data = await res.json();
            if (data.success) {
                setJobs(data.jobs);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(search.toLowerCase()))
    );

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 50%, #0a0a12 100%)',
        }}>
            {/* Hero Section */}
            <div style={{
                padding: '80px 24px 60px',
                textAlign: 'center',
                background: 'radial-gradient(ellipse at center top, rgba(139, 92, 246, 0.15), transparent 70%)',
            }}>
                <h1 style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: 'white',
                    marginBottom: 16,
                    background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Carreiras Lattice
                </h1>
                <p style={{
                    fontSize: 20,
                    color: '#9CA3AF',
                    maxWidth: 600,
                    margin: '0 auto 32px',
                    lineHeight: 1.6,
                }}>
                    Encontre sua próxima oportunidade através de matching baseado em evidências.
                    Sem currículos, sem suposições — apenas competências reais.
                </p>

                {/* Search */}
                <div style={{ maxWidth: 500, margin: '0 auto' }}>
                    <input
                        type="text"
                        placeholder="Buscar vagas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '16px 24px',
                            fontSize: 16,
                            borderRadius: 12,
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            background: 'rgba(30, 30, 50, 0.8)',
                            color: 'white',
                            outline: 'none',
                        }}
                    />
                </div>
            </div>

            {/* How It Works */}
            <div style={{
                padding: '0 24px 48px',
                maxWidth: 1000,
                margin: '0 auto',
            }}>
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
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                        <h3 style={{ color: 'white', marginBottom: 8 }}>Entrevista IA</h3>
                        <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>
                            Tenha uma conversa natural que revela suas verdadeiras capacidades.
                        </p>
                    </div>
                    <div style={{
                        padding: 24,
                        background: 'rgba(30, 30, 50, 0.5)',
                        borderRadius: 16,
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                        <h3 style={{ color: 'white', marginBottom: 8 }}>Lattice de Competências</h3>
                        <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>
                            Obtenha um mapa visual das suas 45 competências em 9 categorias.
                        </p>
                    </div>
                    <div style={{
                        padding: 24,
                        background: 'rgba(30, 30, 50, 0.5)',
                        borderRadius: 16,
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
                        <h3 style={{ color: 'white', marginBottom: 8 }}>Match Perfeito</h3>
                        <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>
                            Veja exatamente como suas competências se alinham com cada vaga.
                        </p>
                    </div>
                </div>
            </div>

            {/* Talent Pool CTA */}
            <div style={{
                padding: '0 24px 32px',
                maxWidth: 800,
                margin: '0 auto',
            }}>
                <Link href="/careers/talent-pool" style={{ textDecoration: 'none' }}>
                    <div style={{
                        padding: 24,
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))',
                        borderRadius: 16,
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <span style={{ fontSize: 24 }}>🌟</span>
                                <h3 style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0 }}>
                                    Join the Talent Pool
                                </h3>
                            </div>
                            <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>
                                Construa seu perfil de competências e deixe empregadores te descobrirem — sem vaga específica
                            </p>
                        </div>
                        <span style={{
                            color: '#A78BFA',
                            fontSize: 24,
                        }}>→</span>
                    </div>
                </Link>
            </div>

            {/* Jobs List */}
            <div style={{
                padding: '0 24px 80px',
                maxWidth: 800,
                margin: '0 auto',
            }}>
                <h2 style={{
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 600,
                    marginBottom: 24,
                }}>
                    Vagas Abertas {jobs.length > 0 && `(${filteredJobs.length})`}
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
                        Carregando vagas...
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 60,
                        background: 'rgba(30, 30, 50, 0.5)',
                        borderRadius: 16,
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <p style={{ color: '#9CA3AF', marginBottom: 8 }}>
                            {jobs.length === 0
                                ? 'Nenhuma vaga disponível ainda.'
                                : 'Nenhuma vaga corresponde à sua busca.'}
                        </p>
                        <p style={{ color: '#6B7280', fontSize: 14 }}>
                            Volte em breve para novas oportunidades.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filteredJobs.map(job => (
                            <Link
                                key={job.id}
                                href={`/careers/${job.id}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div style={{
                                    padding: 24,
                                    background: 'rgba(30, 30, 50, 0.7)',
                                    borderRadius: 16,
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 12,
                                    }}>
                                        <div>
                                            <h3 style={{
                                                color: 'white',
                                                fontSize: 18,
                                                fontWeight: 600,
                                                marginBottom: 4,
                                            }}>
                                                {job.title}
                                            </h3>
                                            <p style={{
                                                color: '#A78BFA',
                                                fontSize: 14,
                                            }}>
                                                {job.company}
                                            </p>
                                        </div>
                                        <span style={{
                                            color: '#6B7280',
                                            fontSize: 12,
                                        }}>
                                            {formatDate(job.postedAt)}
                                        </span>
                                    </div>
                                    {job.description && (
                                        <p style={{
                                            color: '#9CA3AF',
                                            fontSize: 14,
                                            lineHeight: 1.6,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                        }}>
                                            {job.description}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '24px',
                borderTop: '1px solid rgba(139, 92, 246, 0.1)',
                textAlign: 'center',
            }}>
                <p style={{ color: '#6B7280', fontSize: 14 }}>
                    Desenvolvido por <span style={{ color: '#A78BFA' }}>Lattice HR</span> — Matching de talentos baseado em evidências
                </p>
            </div>
        </div>
    );
}

