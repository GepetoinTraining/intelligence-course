'use client';

import { Avatar, AvatarProps, Badge, Group } from '@mantine/core';

interface UserAvatarProps extends Omit<AvatarProps, 'color'> {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: 'student' | 'teacher' | 'staff' | 'admin' | 'parent' | 'owner';
    showRole?: boolean;
    imageUrl?: string;
}

const ROLE_COLORS: Record<string, string> = {
    student: 'violet',
    teacher: 'blue',
    staff: 'cyan',
    admin: 'grape',
    parent: 'green',
    owner: 'orange',
};

const ROLE_LABELS: Record<string, string> = {
    student: 'Aluno',
    teacher: 'Professor',
    staff: 'Equipe',
    admin: 'Admin',
    parent: 'Responsável',
    owner: 'Proprietário',
};

export function UserAvatar({
    firstName = '',
    lastName = '',
    email = '',
    role = 'student',
    showRole = false,
    imageUrl,
    size = 'md',
    ...props
}: UserAvatarProps) {
    const initials = firstName && lastName
        ? `${firstName[0]}${lastName[0]}`.toUpperCase()
        : email
            ? email[0].toUpperCase()
            : '?';

    const color = ROLE_COLORS[role] || 'gray';

    if (showRole) {
        return (
            <Group gap="xs">
                <Avatar
                    src={imageUrl}
                    color={color}
                    radius="xl"
                    size={size}
                    {...props}
                >
                    {initials}
                </Avatar>
                <Badge variant="light" color={color} size="xs">
                    {ROLE_LABELS[role] || role}
                </Badge>
            </Group>
        );
    }

    return (
        <Avatar
            src={imageUrl}
            color={color}
            radius="xl"
            size={size}
            {...props}
        >
            {initials}
        </Avatar>
    );
}

export default UserAvatar;

