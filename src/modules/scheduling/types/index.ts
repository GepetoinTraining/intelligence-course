// Scheduling Module Types

export interface Event {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    type: EventType;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
    recurrence?: RecurrenceRule;
    location?: string;
    roomId?: string;
    createdBy: string;
    attendees?: EventAttendee[];
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export type EventType =
    | 'class'
    | 'meeting'
    | 'event'
    | 'holiday'
    | 'personal'
    | 'reminder';

export interface EventAttendee {
    id: string;
    eventId: string;
    userId: string;
    status: 'pending' | 'accepted' | 'declined' | 'tentative';
    respondedAt?: Date;
}

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    byDay?: string[];
    byMonth?: number[];
    until?: Date;
    count?: number;
}

export interface Room {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    capacity: number;
    type: 'classroom' | 'meeting' | 'lab' | 'auditorium' | 'other';
    amenities?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Resource {
    id: string;
    organizationId: string;
    name: string;
    type: 'equipment' | 'material' | 'vehicle' | 'other';
    quantity: number;
    availableQuantity: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Booking {
    id: string;
    organizationId: string;
    type: 'room' | 'resource';
    roomId?: string;
    resourceId?: string;
    eventId?: string;
    bookedBy: string;
    startAt: Date;
    endAt: Date;
    status: 'pending' | 'confirmed' | 'cancelled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AcademicCalendar {
    id: string;
    organizationId: string;
    year: number;
    name: string;
    startDate: Date;
    endDate: Date;
    events: AcademicCalendarEvent[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AcademicCalendarEvent {
    id: string;
    calendarId: string;
    name: string;
    type: 'term_start' | 'term_end' | 'holiday' | 'exam_period' | 'break' | 'event';
    startDate: Date;
    endDate: Date;
    description?: string;
}

export type CalendarScope =
    | 'personal'
    | 'team'
    | 'leaders'
    | 'director'
    | 'total';

