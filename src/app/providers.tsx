'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import { UserProvider } from '@/hooks/useUser';

// Custom theme for Intelligence Course
const theme = createTheme({
    primaryColor: 'violet',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    defaultRadius: 'md',
});

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

    // In dev mode, skip Clerk entirely
    if (isDevMode) {
        return (
            <MantineProvider theme={theme} defaultColorScheme="light">
                <UserProvider>
                    {children}
                </UserProvider>
            </MantineProvider>
        );
    }

    // Production mode with Clerk
    // Lazy import to avoid errors when Clerk env vars are missing
    const ClerkProviderWrapper = require('./ClerkWrapper').ClerkWrapper;

    return (
        <ClerkProviderWrapper>
            <MantineProvider theme={theme} defaultColorScheme="light">
                <UserProvider>
                    {children}
                </UserProvider>
            </MantineProvider>
        </ClerkProviderWrapper>
    );
}


