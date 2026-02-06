// Academic Module Types

export interface Course {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    description?: string;
    level: string;
    duration: number; // in hours
    status: 'draft' | 'published' | 'archived';
    thumbnail?: string;
    prerequisites?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Class {
    id: string;
    organizationId: string;
    courseId: string;
    name: string;
    code: string;
    termId?: string;
    teacherId?: string;
    roomId?: string;
    maxStudents: number;
    currentStudents: number;
    schedulePattern?: string;
    startDate?: Date;
    endDate?: Date;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface Lesson {
    id: string;
    organizationId: string;
    moduleId: string;
    title: string;
    description?: string;
    content?: string;
    order: number;
    duration: number; // in minutes
    type: 'video' | 'text' | 'interactive' | 'quiz' | 'assignment';
    status: 'draft' | 'published';
    createdAt: Date;
    updatedAt: Date;
}

export interface Module {
    id: string;
    organizationId: string;
    courseId: string;
    name: string;
    description?: string;
    order: number;
    lessons: Lesson[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Attendance {
    id: string;
    organizationId: string;
    classSessionId: string;
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
    recordedBy?: string;
    recordedAt: Date;
}

export interface ClassSession {
    id: string;
    organizationId: string;
    classId: string;
    date: Date;
    startTime: string;
    endTime: string;
    topic?: string;
    notes?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface Grade {
    id: string;
    organizationId: string;
    studentId: string;
    assessmentId: string;
    score: number;
    maxScore: number;
    percentage: number;
    feedback?: string;
    gradedBy?: string;
    gradedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Assessment {
    id: string;
    organizationId: string;
    classId: string;
    name: string;
    type: 'exam' | 'quiz' | 'assignment' | 'project' | 'participation';
    weight: number;
    maxScore: number;
    dueDate?: Date;
    status: 'draft' | 'published' | 'graded';
    createdAt: Date;
    updatedAt: Date;
}

export interface Certificate {
    id: string;
    organizationId: string;
    studentId: string;
    courseId: string;
    enrollmentId: string;
    number: string;
    issuedAt: Date;
    validUntil?: Date;
    documentUrl?: string;
    createdAt: Date;
}

export interface Material {
    id: string;
    organizationId: string;
    lessonId?: string;
    courseId?: string;
    name: string;
    type: 'document' | 'video' | 'audio' | 'image' | 'link';
    url: string;
    size?: number;
    downloadable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

