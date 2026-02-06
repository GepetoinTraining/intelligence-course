// Kaizen Module Types

export interface Suggestion {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    category: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    status: SuggestionStatus;
    submittedBy: string;
    assignedTo?: string;
    votesUp: number;
    votesDown: number;
    implementedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type SuggestionStatus =
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'in_progress'
    | 'implemented'
    | 'rejected';

export interface SuggestionComment {
    id: string;
    suggestionId: string;
    userId: string;
    content: string;
    createdAt: Date;
}

export interface Feedback {
    id: string;
    organizationId: string;
    type: 'positive' | 'negative' | 'neutral';
    category: string;
    content: string;
    source: 'internal' | 'student' | 'parent';
    submittedBy?: string;
    anonymous: boolean;
    status: 'new' | 'reviewed' | 'actioned';
    createdAt: Date;
    updatedAt: Date;
}

export interface Retrospective {
    id: string;
    organizationId: string;
    title: string;
    date: Date;
    facilitator: string;
    participants: string[];
    wentWell: RetrospectiveItem[];
    toImprove: RetrospectiveItem[];
    actionItems: RetrospectiveAction[];
    status: 'scheduled' | 'in_progress' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}

export interface RetrospectiveItem {
    id: string;
    content: string;
    votes: number;
}

export interface RetrospectiveAction {
    id: string;
    description: string;
    assignedTo?: string;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'completed';
}

export interface Improvement {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    suggestionId?: string;
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    startDate?: Date;
    completedDate?: Date;
    owner?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface NPSResponse {
    id: string;
    organizationId: string;
    surveyId: string;
    respondentId?: string;
    score: number; // 0-10
    comment?: string;
    category: 'promoter' | 'passive' | 'detractor';
    createdAt: Date;
}

export interface NPSSurvey {
    id: string;
    organizationId: string;
    name: string;
    question: string;
    audience: 'students' | 'parents' | 'staff' | 'all';
    status: 'draft' | 'active' | 'closed';
    startDate?: Date;
    endDate?: Date;
    responseCount: number;
    npsScore?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Survey {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    questions: SurveyQuestion[];
    audience: 'students' | 'parents' | 'staff' | 'all';
    status: 'draft' | 'active' | 'closed';
    startDate?: Date;
    endDate?: Date;
    responseCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SurveyQuestion {
    id: string;
    surveyId: string;
    order: number;
    type: 'text' | 'rating' | 'multiple_choice' | 'checkbox' | 'scale';
    question: string;
    options?: string[];
    required: boolean;
}

export interface IdeaBoard {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    columns: IdeaBoardColumn[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IdeaBoardColumn {
    id: string;
    boardId: string;
    name: string;
    order: number;
    color: string;
    ideas: Idea[];
}

export interface Idea {
    id: string;
    columnId: string;
    title: string;
    description?: string;
    author: string;
    votes: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

