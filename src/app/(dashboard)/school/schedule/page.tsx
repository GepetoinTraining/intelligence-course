'use client';

import { redirect } from 'next/navigation';

// This page redirects to /school/schedules (plural)
// The navigation has /school/schedule but the actual page is at /school/schedules
export default function SchoolScheduleRedirect() {
    redirect('/school/schedules');
}

