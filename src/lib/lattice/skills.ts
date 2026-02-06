/**
 * Lattice Skill Topology
 * 
 * 9 Categories, 45 Skills
 * Based on the Lattice HR framework for evidence-based talent matching
 */

// ============================================================================
// Skill Categories
// ============================================================================

export const SKILL_CATEGORIES = [
    'communication',
    'adaptability',
    'diversity_understanding',
    'social_media_digital',
    'emotional_intelligence',
    'time_management',
    'networking',
    'continuous_learning',
    'logic_reasoning',
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];

// ============================================================================
// Position Scale (Shadow Model)
// ============================================================================

export const POSITION_SCALE = {
    CORE: 2,       // Foundational strength, defines the person
    DEEP: 1,       // Developed, reliable, consistent
    MID: 0,        // Neutral, functional, unremarkable
    SURFACE: -1,   // Underdeveloped, gap, needs support
    SHADOW: -2,    // Active liability, inverts adjacent strengths
} as const;

export type PositionLevel = typeof POSITION_SCALE[keyof typeof POSITION_SCALE];

export const POSITION_NAMES: Record<number, string> = {
    2: 'CORE',
    1: 'DEEP',
    0: 'MID',
    [-1]: 'SURFACE',
    [-2]: 'SHADOW',
};

// ============================================================================
// Skill Definitions
// ============================================================================

export interface SkillDefinition {
    id: string;
    category: SkillCategory;
    name: string;
    description: string;
    adjacentSkills: string[];  // Skills affected by shadow casting
}

export const SKILLS: SkillDefinition[] = [
    // ========================================================================
    // COMMUNICATION (6 skills)
    // ========================================================================
    {
        id: 'comm_verbal',
        category: 'communication',
        name: 'Verbal Communication',
        description: 'Ability to express ideas clearly through speech',
        adjacentSkills: ['comm_assertive', 'comm_effective', 'eq_social_skills'],
    },
    {
        id: 'comm_written',
        category: 'communication',
        name: 'Written Communication',
        description: 'Clarity and effectiveness in written expression',
        adjacentSkills: ['comm_digital', 'comm_effective', 'smd_content'],
    },
    {
        id: 'comm_nonverbal',
        category: 'communication',
        name: 'Non-verbal Communication',
        description: 'Reading and using body language, tone, expressions',
        adjacentSkills: ['eq_empathy', 'eq_social_skills', 'comm_verbal'],
    },
    {
        id: 'comm_assertive',
        category: 'communication',
        name: 'Assertive Communication',
        description: 'Expressing needs and boundaries clearly without aggression',
        adjacentSkills: ['eq_regulation', 'eq_conflict', 'comm_verbal'],
    },
    {
        id: 'comm_digital',
        category: 'communication',
        name: 'Digital Communication',
        description: 'Effective communication through digital channels',
        adjacentSkills: ['comm_written', 'smd_personal_branding', 'smd_networking'],
    },
    {
        id: 'comm_effective',
        category: 'communication',
        name: 'Effective Communication',
        description: 'Overall ability to convey and receive information',
        adjacentSkills: ['comm_verbal', 'comm_written', 'eq_empathy'],
    },

    // ========================================================================
    // ADAPTABILITY (5 skills)
    // ========================================================================
    {
        id: 'adapt_change',
        category: 'adaptability',
        name: 'Change Embrace',
        description: 'Openness and positive response to change',
        adjacentSkills: ['adapt_pivoting', 'adapt_resilience', 'cl_adaptation'],
    },
    {
        id: 'adapt_pivoting',
        category: 'adaptability',
        name: 'Pivoting',
        description: 'Ability to shift direction when circumstances require',
        adjacentSkills: ['adapt_change', 'adapt_creative_problem', 'lr_decomposition'],
    },
    {
        id: 'adapt_creative_problem',
        category: 'adaptability',
        name: 'Creative Problem-Solving',
        description: 'Finding novel solutions to challenges',
        adjacentSkills: ['lr_abstraction', 'lr_analogy', 'adapt_pivoting'],
    },
    {
        id: 'adapt_critical_thinking',
        category: 'adaptability',
        name: 'Critical Thinking',
        description: 'Analyzing situations objectively and making reasoned judgments',
        adjacentSkills: ['lr_traversal', 'lr_decomposition', 'cl_self_evaluation'],
    },
    {
        id: 'adapt_resilience',
        category: 'adaptability',
        name: 'Resilience',
        description: 'Bouncing back from setbacks and maintaining effectiveness',
        adjacentSkills: ['eq_regulation', 'tm_procrastination', 'adapt_change'],
    },

    // ========================================================================
    // DIVERSITY UNDERSTANDING (4 skills)
    // ========================================================================
    {
        id: 'div_cross_cultural',
        category: 'diversity_understanding',
        name: 'Cross-Cultural Awareness',
        description: 'Understanding and respecting different cultural perspectives',
        adjacentSkills: ['eq_empathy', 'div_inclusive_comm', 'comm_effective'],
    },
    {
        id: 'div_generational',
        category: 'diversity_understanding',
        name: 'Generational Bridging',
        description: 'Connecting across different age groups and perspectives',
        adjacentSkills: ['div_cross_cultural', 'net_mentorship', 'comm_effective'],
    },
    {
        id: 'div_inclusive_comm',
        category: 'diversity_understanding',
        name: 'Inclusive Communication',
        description: 'Communicating in ways that include all participants',
        adjacentSkills: ['comm_effective', 'eq_empathy', 'div_cross_cultural'],
    },
    {
        id: 'div_org_navigation',
        category: 'diversity_understanding',
        name: 'Organizational Navigation',
        description: 'Understanding and working within organizational dynamics',
        adjacentSkills: ['net_partnerships', 'eq_social_skills', 'adapt_pivoting'],
    },

    // ========================================================================
    // SOCIAL MEDIA & DIGITAL (5 skills)
    // ========================================================================
    {
        id: 'smd_personal_branding',
        category: 'social_media_digital',
        name: 'Personal Branding',
        description: 'Building and maintaining a professional online presence',
        adjacentSkills: ['smd_reputation', 'smd_content', 'comm_digital'],
    },
    {
        id: 'smd_reputation',
        category: 'social_media_digital',
        name: 'Reputation Management',
        description: 'Monitoring and managing online reputation',
        adjacentSkills: ['smd_personal_branding', 'smd_privacy', 'eq_self_awareness'],
    },
    {
        id: 'smd_networking',
        category: 'social_media_digital',
        name: 'Digital Networking',
        description: 'Building professional connections through digital platforms',
        adjacentSkills: ['net_relationship_building', 'comm_digital', 'smd_personal_branding'],
    },
    {
        id: 'smd_privacy',
        category: 'social_media_digital',
        name: 'Privacy Awareness',
        description: 'Understanding and managing digital privacy',
        adjacentSkills: ['smd_reputation', 'adapt_critical_thinking', 'lr_abstraction'],
    },
    {
        id: 'smd_content',
        category: 'social_media_digital',
        name: 'Content Creation',
        description: 'Creating engaging and relevant digital content',
        adjacentSkills: ['comm_written', 'smd_personal_branding', 'adapt_creative_problem'],
    },

    // ========================================================================
    // EMOTIONAL INTELLIGENCE (5 skills)
    // ========================================================================
    {
        id: 'eq_self_awareness',
        category: 'emotional_intelligence',
        name: 'Self-Awareness',
        description: 'Understanding own emotions, strengths, and weaknesses',
        adjacentSkills: ['eq_regulation', 'cl_self_evaluation', 'adapt_resilience'],
    },
    {
        id: 'eq_regulation',
        category: 'emotional_intelligence',
        name: 'Emotional Regulation',
        description: 'Managing emotions effectively in various situations',
        adjacentSkills: ['eq_self_awareness', 'adapt_resilience', 'eq_conflict'],
    },
    {
        id: 'eq_empathy',
        category: 'emotional_intelligence',
        name: 'Empathy',
        description: 'Understanding and sharing the feelings of others',
        adjacentSkills: ['eq_social_skills', 'comm_nonverbal', 'div_inclusive_comm'],
    },
    {
        id: 'eq_social_skills',
        category: 'emotional_intelligence',
        name: 'Social Skills',
        description: 'Building rapport and managing relationships effectively',
        adjacentSkills: ['eq_empathy', 'net_relationship_building', 'comm_verbal'],
    },
    {
        id: 'eq_conflict',
        category: 'emotional_intelligence',
        name: 'Conflict Transformation',
        description: 'Turning conflicts into opportunities for growth',
        adjacentSkills: ['eq_regulation', 'comm_assertive', 'adapt_creative_problem'],
    },

    // ========================================================================
    // TIME MANAGEMENT (5 skills)
    // ========================================================================
    {
        id: 'tm_prioritization',
        category: 'time_management',
        name: 'Prioritization',
        description: 'Identifying and focusing on what matters most',
        adjacentSkills: ['tm_goal_setting', 'lr_sequencing', 'adapt_critical_thinking'],
    },
    {
        id: 'tm_goal_setting',
        category: 'time_management',
        name: 'Goal Setting',
        description: 'Defining clear, achievable objectives',
        adjacentSkills: ['tm_prioritization', 'cl_learning_plans', 'lr_sequencing'],
    },
    {
        id: 'tm_focus',
        category: 'time_management',
        name: 'Focus',
        description: 'Maintaining concentration on tasks',
        adjacentSkills: ['tm_interruption', 'tm_procrastination', 'eq_regulation'],
    },
    {
        id: 'tm_interruption',
        category: 'time_management',
        name: 'Interruption Handling',
        description: 'Managing disruptions while maintaining productivity',
        adjacentSkills: ['tm_focus', 'adapt_pivoting', 'eq_regulation'],
    },
    {
        id: 'tm_procrastination',
        category: 'time_management',
        name: 'Procrastination Management',
        description: 'Overcoming tendencies to delay important tasks',
        adjacentSkills: ['tm_focus', 'adapt_resilience', 'eq_self_awareness'],
    },

    // ========================================================================
    // NETWORKING (5 skills)
    // ========================================================================
    {
        id: 'net_relationship_building',
        category: 'networking',
        name: 'Relationship Building',
        description: 'Creating and nurturing professional relationships',
        adjacentSkills: ['eq_social_skills', 'smd_networking', 'net_cultivation'],
    },
    {
        id: 'net_mentorship',
        category: 'networking',
        name: 'Mentorship',
        description: 'Guiding others or being guided in professional development',
        adjacentSkills: ['net_relationship_building', 'div_generational', 'cl_feedback'],
    },
    {
        id: 'net_cultivation',
        category: 'networking',
        name: 'Network Cultivation',
        description: 'Maintaining and growing professional networks over time',
        adjacentSkills: ['net_relationship_building', 'net_partnerships', 'tm_prioritization'],
    },
    {
        id: 'net_partnerships',
        category: 'networking',
        name: 'Partnerships',
        description: 'Building strategic alliances and collaborations',
        adjacentSkills: ['net_cultivation', 'div_org_navigation', 'adapt_creative_problem'],
    },
    {
        id: 'net_recognition',
        category: 'networking',
        name: 'Recognition',
        description: 'Acknowledging others and being recognized for contributions',
        adjacentSkills: ['eq_empathy', 'net_relationship_building', 'smd_personal_branding'],
    },

    // ========================================================================
    // CONTINUOUS LEARNING (5 skills)
    // ========================================================================
    {
        id: 'cl_trend_awareness',
        category: 'continuous_learning',
        name: 'Trend Awareness',
        description: 'Staying current with industry and field developments',
        adjacentSkills: ['cl_adaptation', 'adapt_change', 'smd_content'],
    },
    {
        id: 'cl_feedback',
        category: 'continuous_learning',
        name: 'Feedback Acceptance',
        description: 'Receiving and acting on constructive feedback',
        adjacentSkills: ['eq_regulation', 'cl_self_evaluation', 'adapt_resilience'],
    },
    {
        id: 'cl_self_evaluation',
        category: 'continuous_learning',
        name: 'Self-Evaluation',
        description: 'Honestly assessing own performance and areas for growth',
        adjacentSkills: ['eq_self_awareness', 'cl_feedback', 'cl_learning_plans'],
    },
    {
        id: 'cl_learning_plans',
        category: 'continuous_learning',
        name: 'Learning Plans',
        description: 'Creating and following structured learning paths',
        adjacentSkills: ['cl_self_evaluation', 'tm_goal_setting', 'cl_adaptation'],
    },
    {
        id: 'cl_adaptation',
        category: 'continuous_learning',
        name: 'Learning Adaptation',
        description: 'Adjusting learning approaches based on results',
        adjacentSkills: ['cl_learning_plans', 'adapt_change', 'adapt_pivoting'],
    },

    // ========================================================================
    // LOGIC & REASONING (5 skills)
    // ========================================================================
    {
        id: 'lr_traversal',
        category: 'logic_reasoning',
        name: 'Traversal',
        description: 'Following logical chains of reasoning step by step',
        adjacentSkills: ['lr_sequencing', 'lr_decomposition', 'adapt_critical_thinking'],
    },
    {
        id: 'lr_decomposition',
        category: 'logic_reasoning',
        name: 'Decomposition',
        description: 'Breaking complex problems into manageable parts',
        adjacentSkills: ['lr_traversal', 'lr_abstraction', 'adapt_pivoting'],
    },
    {
        id: 'lr_abstraction',
        category: 'logic_reasoning',
        name: 'Abstraction',
        description: 'Identifying patterns and generalizing from specifics',
        adjacentSkills: ['lr_decomposition', 'lr_analogy', 'adapt_creative_problem'],
    },
    {
        id: 'lr_analogy',
        category: 'logic_reasoning',
        name: 'Analogy',
        description: 'Drawing parallels between different domains',
        adjacentSkills: ['lr_abstraction', 'adapt_creative_problem', 'div_cross_cultural'],
    },
    {
        id: 'lr_sequencing',
        category: 'logic_reasoning',
        name: 'Sequencing',
        description: 'Ordering steps and processes logically',
        adjacentSkills: ['lr_traversal', 'tm_prioritization', 'tm_goal_setting'],
    },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all skills for a category
 */
export function getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
    return SKILLS.filter(s => s.category === category);
}

/**
 * Get skill by ID
 */
export function getSkillById(id: string): SkillDefinition | undefined {
    return SKILLS.find(s => s.id === id);
}

/**
 * Get adjacent skills for shadow casting
 */
export function getAdjacentSkills(skillId: string): SkillDefinition[] {
    const skill = getSkillById(skillId);
    if (!skill) return [];
    return skill.adjacentSkills
        .map(id => getSkillById(id))
        .filter((s): s is SkillDefinition => s !== undefined);
}

/**
 * Get human-readable skill name from id
 */
export function getSkillName(skillId: string): string {
    const skill = getSkillById(skillId);
    return skill?.name || skillId;
}

/**
 * Get category display name
 */
export function getCategoryName(category: SkillCategory): string {
    const names: Record<SkillCategory, string> = {
        communication: 'Communication',
        adaptability: 'Adaptability',
        diversity_understanding: 'Diversity Understanding',
        social_media_digital: 'Social Media & Digital',
        emotional_intelligence: 'Emotional Intelligence',
        time_management: 'Time Management',
        networking: 'Networking',
        continuous_learning: 'Continuous Learning',
        logic_reasoning: 'Logic & Reasoning',
    };
    return names[category] || category;
}

/**
 * Get position level name
 */
export function getPositionName(position: number): string {
    if (position >= 1.5) return 'CORE';
    if (position >= 0.5) return 'DEEP';
    if (position >= -0.5) return 'MID';
    if (position >= -1.5) return 'SURFACE';
    return 'SHADOW';
}

/**
 * Calculate shadow impact
 * When a skill is in SHADOW position, it negatively affects adjacent skills
 */
export function calculateShadowImpact(
    skillId: string,
    position: number
): { affectedSkillId: string; impact: number }[] {
    if (position > -1.5) return []; // Only SHADOW casts shadow

    const adjacentSkills = getAdjacentSkills(skillId);
    const shadowIntensity = Math.abs(position + 1); // 0-1 range

    return adjacentSkills.map(skill => ({
        affectedSkillId: skill.id,
        impact: -0.5 * shadowIntensity, // Reduce adjacent skill by up to 0.5
    }));
}

