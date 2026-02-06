'use client';

import { useState, useRef } from 'react';
import { Paper, Stack, Group, Text, Button, Image, Progress, ActionIcon } from '@mantine/core';
import { IconUpload, IconPhoto, IconX, IconFile } from '@tabler/icons-react';

interface FileUploadProps {
    accept?: string;
    maxSize?: number; // in MB
    onUpload?: (file: File) => void;
    preview?: boolean;
    label?: string;
    description?: string;
}

export function FileUpload({
    accept = 'image/*',
    maxSize = 5,
    onUpload,
    preview = true,
    label = 'Upload de arquivo',
    description = 'Arraste ou clique para selecionar',
}: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFile: File) => {
        setError(null);

        // Validate size
        if (selectedFile.size > maxSize * 1024 * 1024) {
            setError(`Arquivo muito grande. Máximo: ${maxSize}MB`);
            return;
        }

        setFile(selectedFile);

        // Generate preview for images
        if (preview && selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }

        // Simulate upload progress
        setUploading(true);
        let prog = 0;
        const interval = setInterval(() => {
            prog += 20;
            setProgress(prog);
            if (prog >= 100) {
                clearInterval(interval);
                setUploading(false);
                onUpload?.(selectedFile);
            }
        }, 200);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setPreviewUrl(null);
        setProgress(0);
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <Stack gap="xs">
            {label && <Text size="sm" fw={500}>{label}</Text>}

            <Paper
                p="lg"
                radius="md"
                withBorder
                style={{
                    borderStyle: 'dashed',
                    cursor: 'pointer',
                    textAlign: 'center',
                    position: 'relative',
                }}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                />

                {file && previewUrl ? (
                    <Stack align="center" gap="sm">
                        <div style={{ position: 'relative' }}>
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                radius="md"
                                h={120}
                                w="auto"
                                fit="contain"
                            />
                            <ActionIcon
                                variant="filled"
                                color="red"
                                size="sm"
                                radius="xl"
                                style={{ position: 'absolute', top: -8, right: -8 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                            >
                                <IconX size={12} />
                            </ActionIcon>
                        </div>
                        <Text size="xs" c="dimmed">{file.name}</Text>
                        {uploading && <Progress value={progress} size="xs" w="100%" />}
                    </Stack>
                ) : file ? (
                    <Stack align="center" gap="sm">
                        <IconFile size={48} color="gray" />
                        <Text size="sm">{file.name}</Text>
                        <Text size="xs" c="dimmed">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                        {uploading && <Progress value={progress} size="xs" w="100%" />}
                        <Button
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                        >
                            Remover
                        </Button>
                    </Stack>
                ) : (
                    <Stack align="center" gap="xs">
                        <IconUpload size={32} color="gray" />
                        <Text size="sm" c="dimmed">{description}</Text>
                        <Text size="xs" c="dimmed">Máximo: {maxSize}MB</Text>
                    </Stack>
                )}
            </Paper>

            {error && <Text size="xs" c="red">{error}</Text>}
        </Stack>
    );
}

export default FileUpload;

