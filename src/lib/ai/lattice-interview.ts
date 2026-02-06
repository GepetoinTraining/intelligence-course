/**
 * Lattice Interview System
 * 
 * Conducts the initial AI interview to map a person's skills, values, and style.
 * Triggered on first AI conversation (when user.latticeInterviewPending = 1).
 * 
 * The interview:
 * 1. Uses a structured conversation flow
 * 2. Extracts Dreams, Hobbies, Aspirations (3x3 SCRM)
 * 3. Identifies skills from the 45-skill framework
 * 4. Detects communication style and learning preferences
 * 5. Creates the personLattice record
 * 6. Generates embeddings for talent matching
 */

import { db } from '@/lib/db';
import { users, persons, personLattice } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// INTERVIEW PROMPTS
// ============================================================================

/**
 * System prompt for the Lattice Interview AI
 */
export const LATTICE_INTERVIEW_SYSTEM_PROMPT = `Você é Synapse, um facilitador empático conduzindo uma entrevista de mapeamento pessoal.

## Seu Objetivo

Descobrir, através de conversa natural, quem é essa pessoa:
- Seus **sonhos** (o que ela espera alcançar)
- Seus **hobbies** (o que ela faz quando é livre)
- Suas **aspirações** (quem ela está se tornando)
- Suas **habilidades** (o que ela sabe fazer bem)
- Seu **estilo** (como ela se comunica e aprende)

## Diretrizes

1. **Seja natural e conversacional** - isso não é um interrogatório
2. **Faça uma pergunta por vez** - dê espaço para reflexão
3. **Mostre interesse genuíno** - as respostas importam
4. **Adapte-se ao estilo** - se a pessoa é sintética, seja direto; se é expansiva, explore
5. **Não mencione que está "mapeando"** - mantenha a conversa fluida
6. **Resuma e valide** - ao final, confirme se entendeu corretamente

## Fluxo Sugerido (5-10 trocas)

1. **Abertura calorosa**: Apresente-se, pergunte algo leve para quebrar o gelo
2. **Contexto profissional**: O que a pessoa faz? O que a trouxe aqui?
3. **Interesses pessoais**: O que ela gosta de fazer no tempo livre? (hobbies)
4. **Aspirações**: Onde ela se vê em 5 anos? O que a empolga sobre o futuro?
5. **Sonhos**: Se pudesse fazer qualquer coisa, o que seria?
6. **Habilidades**: O que ela considera seu diferencial? O que outros pedem ajuda?
7. **Fechamento**: Agradeça e confirme os pontos principais

## Formato de Saída Interno

Após coletar informações suficientes, você pode usar a ferramenta \`complete_lattice_interview\` com:
- dreams: 3 principais sonhos
- hobbies: 3 hobbies identificados
- aspirations: 3 aspirações de carreira/vida
- skills: habilidades identificadas com níveis estimados
- communicationStyle: 'analytical' | 'expressive' | 'driver' | 'amiable'
- learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
- statedGoals: metas explícitas mencionadas
- inferredGoals: metas que você inferiu do contexto

## Importante

- A entrevista deve parecer uma conversa, não um formulário
- Não force todas as perguntas se a pessoa já revelou informações organicamente
- Se a pessoa parecer desconfortável, seja mais leve
- O objetivo é criar uma conexão genuína enquanto coleta insights`;

/**
 * Interview opening messages based on context
 */
export const INTERVIEW_OPENERS = {
    talent: `Olá! 👋 Sou Synapse, e estou aqui para conhecer você melhor.

Antes de começarmos, gostaria de saber um pouco sobre quem você é - não só profissionalmente, mas como pessoa. Isso vai me ajudar a entender como posso ser mais útil para você aqui.

Para começar: o que te trouxe até aqui hoje?`,

    student: `Olá! 👋 Sou Synapse, seu companheiro de aprendizado.

Antes de mergulharmos nos estudos, quero te conhecer melhor. Cada pessoa aprende de um jeito único, e quanto mais eu souber sobre você, melhor posso te ajudar.

Me conta: o que você gosta de fazer quando não está estudando?`,

    parent: `Olá! 👋 Sou Synapse, e estou aqui para ajudar você a acompanhar a jornada educacional do seu filho/filha.

Para entender melhor como posso ser útil, gostaria de saber mais sobre você e suas expectativas.

O que te motivou a buscar essa parceria educacional?`,

    staff: `Olá! 👋 Sou Synapse, e faço parte do seu onboarding.

Vou te conhecer melhor para que eu possa te apoiar no dia a dia. Isso não é uma avaliação - é uma conversa para entender seu estilo, interesses e objetivos.

Para começar: o que te atraiu para essa oportunidade?`,

    default: `Olá! 👋 Sou Synapse.

Antes de começarmos, gostaria de te conhecer melhor. Vou fazer algumas perguntas para entender seu estilo e interesses.

Me conta um pouco sobre você - o que você gosta de fazer?`,
};

// ============================================================================
// SKILL FRAMEWORK (45 skills in 9 categories)
// ============================================================================

export const SKILL_CATEGORIES = {
    TECHNICAL: ['programming', 'data_analysis', 'system_design', 'debugging', 'automation'],
    COMMUNICATION: ['writing', 'public_speaking', 'active_listening', 'negotiation', 'feedback'],
    LEADERSHIP: ['team_management', 'delegation', 'mentoring', 'decision_making', 'conflict_resolution'],
    CREATIVE: ['design_thinking', 'innovation', 'problem_solving', 'visual_design', 'storytelling'],
    ANALYTICAL: ['critical_thinking', 'research', 'pattern_recognition', 'strategic_planning', 'risk_assessment'],
    INTERPERSONAL: ['empathy', 'collaboration', 'networking', 'influence', 'cultural_awareness'],
    ORGANIZATIONAL: ['project_management', 'time_management', 'prioritization', 'attention_to_detail', 'process_improvement'],
    ADAPTABILITY: ['learning_agility', 'resilience', 'flexibility', 'stress_management', 'change_management'],
    DOMAIN: ['industry_knowledge', 'regulatory_compliance', 'customer_insight', 'market_awareness', 'financial_acumen'],
};

export const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

// ============================================================================
// INTERVIEW STATE MANAGEMENT
// ============================================================================

export interface InterviewState {
    userId: string;
    personId: string;
    sessionId: string;
    startedAt: number;
    messageCount: number;

    // Collected data (progressive)
    collectedDreams: string[];
    collectedHobbies: string[];
    collectedAspirations: string[];
    collectedSkills: { skill: string; level: number; evidence: string }[];
    inferredCommunicationStyle: string | null;
    inferredLearningStyle: string | null;
    statedGoals: string[];
    inferredGoals: string[];

    // Conversation metadata
    conversationSummary: string;
    isComplete: boolean;
}

// In-memory interview states (for active interviews)
const activeInterviews = new Map<string, InterviewState>();

/**
 * Check if a user needs the Lattice interview
 */
export async function needsLatticeInterview(userId: string): Promise<boolean> {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    return user?.latticeInterviewPending === 1;
}

/**
 * Get or create interview state for a user
 */
export function getInterviewState(userId: string, personId: string, sessionId: string): InterviewState {
    let state = activeInterviews.get(userId);

    if (!state) {
        state = {
            userId,
            personId,
            sessionId,
            startedAt: Date.now(),
            messageCount: 0,
            collectedDreams: [],
            collectedHobbies: [],
            collectedAspirations: [],
            collectedSkills: [],
            inferredCommunicationStyle: null,
            inferredLearningStyle: null,
            statedGoals: [],
            inferredGoals: [],
            conversationSummary: '',
            isComplete: false,
        };
        activeInterviews.set(userId, state);
    }

    return state;
}

/**
 * Update interview state after AI response
 */
export function updateInterviewState(
    userId: string,
    updates: Partial<InterviewState>
): InterviewState | null {
    const state = activeInterviews.get(userId);
    if (!state) return null;

    Object.assign(state, updates);
    state.messageCount++;

    return state;
}

/**
 * Get the interview opener based on user context
 */
export function getInterviewOpener(context: 'talent' | 'student' | 'parent' | 'staff' | 'default'): string {
    return INTERVIEW_OPENERS[context] || INTERVIEW_OPENERS.default;
}

// ============================================================================
// INTERVIEW COMPLETION
// ============================================================================

export interface LatticeInterviewResult {
    dreams: string[];
    hobbies: string[];
    aspirations: string[];
    skills: { skillId: string; score: number; evidence: string }[];
    communicationStyle: 'analytical' | 'expressive' | 'driver' | 'amiable';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    statedGoals: string[];
    inferredGoals: string[];
}

/**
 * Complete the interview and create the personLattice record
 */
export async function completeInterview(
    userId: string,
    personId: string,
    result: LatticeInterviewResult,
    sessionId: string
): Promise<void> {
    const state = activeInterviews.get(userId);
    const interviewDuration = state ? Math.floor((Date.now() - state.startedAt) / 1000) : 0;

    // Create personLattice record
    await db.insert(personLattice).values({
        personId,
        interviewSessionId: sessionId,
        interviewDurationSec: interviewDuration,

        skillVector: JSON.stringify(result.skills),
        discoveredValues: JSON.stringify([...result.dreams, ...result.aspirations]),
        communicationStyle: result.communicationStyle,
        learningStyle: result.learningStyle,
        statedGoals: JSON.stringify(result.statedGoals),
        inferredGoals: JSON.stringify(result.inferredGoals),
    }).onConflictDoUpdate({
        target: personLattice.personId,
        set: {
            skillVector: JSON.stringify(result.skills),
            discoveredValues: JSON.stringify([...result.dreams, ...result.aspirations]),
            communicationStyle: result.communicationStyle,
            learningStyle: result.learningStyle,
            statedGoals: JSON.stringify(result.statedGoals),
            inferredGoals: JSON.stringify(result.inferredGoals),
            lastUpdatedAt: Math.floor(Date.now() / 1000),
            version: personLattice.version,
        },
    });

    // Update person with lattice reference
    await db.update(persons).set({
        latticeInterviewCompleted: 1,
        latticeInterviewedAt: Math.floor(Date.now() / 1000),
    }).where(eq(persons.id, personId));

    // Mark user as no longer needing interview
    await db.update(users).set({
        latticeInterviewPending: 0,
    }).where(eq(users.id, userId));

    // Clean up interview state
    activeInterviews.delete(userId);
}

/**
 * MCP Tool definition for completing the interview
 */
export const COMPLETE_LATTICE_INTERVIEW_TOOL = {
    name: 'complete_lattice_interview',
    description: 'Complete the Lattice interview and save the discovered profile. Use this when you have collected enough information about the person.',
    input_schema: {
        type: 'object' as const,
        properties: {
            dreams: {
                type: 'array',
                items: { type: 'string' },
                description: 'Top 3 dreams/hopes the person mentioned',
            },
            hobbies: {
                type: 'array',
                items: { type: 'string' },
                description: 'Top 3 hobbies/interests discovered',
            },
            aspirations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Top 3 career/life aspirations',
            },
            skills: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        skillId: { type: 'string' },
                        score: { type: 'number', minimum: 0, maximum: 100 },
                        evidence: { type: 'string' },
                    },
                },
                description: 'Skills identified with confidence scores and evidence',
            },
            communicationStyle: {
                type: 'string',
                enum: ['analytical', 'expressive', 'driver', 'amiable'],
            },
            learningStyle: {
                type: 'string',
                enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
            },
            statedGoals: {
                type: 'array',
                items: { type: 'string' },
                description: 'Goals explicitly stated by the person',
            },
            inferredGoals: {
                type: 'array',
                items: { type: 'string' },
                description: 'Goals inferred from context',
            },
        },
        required: ['dreams', 'hobbies', 'aspirations', 'communicationStyle', 'learningStyle'],
    },
};

// ============================================================================
// EMBEDDING GENERATION (for talent matching)
// ============================================================================

/**
 * Generate profile text for embedding
 */
export function generateProfileTextForEmbedding(result: LatticeInterviewResult): string {
    const parts = [
        `Dreams: ${result.dreams.join(', ')}`,
        `Hobbies: ${result.hobbies.join(', ')}`,
        `Aspirations: ${result.aspirations.join(', ')}`,
        `Skills: ${result.skills.map(s => `${s.skillId} (${s.score}%)`).join(', ')}`,
        `Communication: ${result.communicationStyle}`,
        `Learning: ${result.learningStyle}`,
        `Goals: ${[...result.statedGoals, ...result.inferredGoals].join(', ')}`,
    ];

    return parts.join('\n');
}

/**
 * Check if interview has collected enough data (heuristic)
 */
export function hasEnoughData(state: InterviewState): boolean {
    return (
        state.messageCount >= 5 &&
        state.collectedDreams.length >= 1 &&
        state.collectedHobbies.length >= 1 &&
        state.collectedAspirations.length >= 1
    );
}

