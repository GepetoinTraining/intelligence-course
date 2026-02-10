'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Table, Modal, TextInput, Select,
    NumberInput, Textarea, Tabs, Switch, Divider, Grid
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconPackage,
    IconCurrencyDollar, IconBook, IconCheck, IconLink, IconUsers,
    IconCopy, IconArchive
} from '@tabler/icons-react';
import Link from 'next/link';

interface PricingTier {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
}

interface Product {
    id: string;
    name: string;
    type: 'tuition' | 'material' | 'event' | 'other';
    basePrice: number;
    description: string;
    courseId?: string;
    courseName?: string;
    levelId?: string;
    levelName?: string;
    pricingTiers: PricingTier[];
    isActive: boolean;
    salesCount: number;
}

const PRODUCT_TYPES = [
    { value: 'tuition', label: 'Mensalidade' },
    { value: 'material', label: 'Material Didático' },
    { value: 'event', label: 'Evento' },
    { value: 'other', label: 'Outro' },
];

const COURSES = [
    { value: 'intelligence', label: 'Alfabetização em IA' },
    { value: 'kids', label: 'Intelligence Kids' },
    { value: 'teens', label: 'Intelligence Teens' },
];

const LEVELS = [
    { value: 'a1', label: 'A1 - Iniciante' },
    { value: 'a2', label: 'A2 - Básico' },
    { value: 'b1', label: 'B1 - Intermediário' },
    { value: 'b2', label: 'B2 - Avançado' },
];

export default function ProductCatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [tierModal, { open: openTierModal, close: closeTierModal }] = useDisclosure(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    // Form state
    const [name, setName] = useState('');
    const [productType, setProductType] = useState<string | null>('tuition');
    const [basePrice, setBasePrice] = useState<number>(0);
    const [description, setDescription] = useState('');
    const [courseId, setCourseId] = useState<string | null>(null);
    const [levelId, setLevelId] = useState<string | null>(null);
    const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

    // Tier form
    const [tierName, setTierName] = useState('');
    const [tierPrice, setTierPrice] = useState<number>(0);
    const [tierDesc, setTierDesc] = useState('');
    const [tierFeatures, setTierFeatures] = useState('');

    const resetForm = () => {
        setName('');
        setProductType('tuition');
        setBasePrice(0);
        setDescription('');
        setCourseId(null);
        setLevelId(null);
        setPricingTiers([]);
        setEditingProduct(null);
    };

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/products');
            if (!res.ok) return;
            const json = await res.json();
            const rows = json.data || [];
            setProducts(rows.map((r: any) => ({
                id: r.id,
                name: r.name || 'Produto',
                type: r.type || 'other',
                basePrice: r.price || r.basePrice || 0,
                description: r.description || '',
                courseId: r.courseId,
                courseName: r.courseName,
                levelId: r.levelId,
                levelName: r.levelName,
                pricingTiers: r.pricingTiers || [],
                isActive: r.isActive !== false && r.isActive !== 0,
                salesCount: r.salesCount || 0,
            })));
        } catch (err) {
            console.error('Failed to fetch products', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setProductType(product.type);
        setBasePrice(product.basePrice);
        setDescription(product.description);
        setCourseId(product.courseId || null);
        setLevelId(product.levelId || null);
        setPricingTiers(product.pricingTiers);
        openModal();
    };

    const handleSave = async () => {
        if (editingProduct) {
            try {
                await fetch(`/api/products/${editingProduct.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, type: productType, price: basePrice, description }),
                });
                fetchProducts();
            } catch (err) { console.error('Failed to update product', err); }
        } else if (name && productType) {
            try {
                await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, type: productType, price: basePrice, description }),
                });
                fetchProducts();
            } catch (err) { console.error('Failed to create product', err); }
        }
        closeModal();
        resetForm();
    };

    const handleAddTier = () => {
        if (tierName && tierPrice > 0) {
            const newTier: PricingTier = {
                id: `tier-${Date.now()}`,
                name: tierName,
                price: tierPrice,
                description: tierDesc,
                features: tierFeatures.split('\n').filter(f => f.trim()),
            };
            setPricingTiers(prev => [...prev, newTier]);
            setTierName('');
            setTierPrice(0);
            setTierDesc('');
            setTierFeatures('');
            closeTierModal();
        }
    };

    const handleRemoveTier = (tierId: string) => {
        setPricingTiers(prev => prev.filter(t => t.id !== tierId));
    };

    const handleToggleActive = (productId: string) => {
        setProducts(prev => prev.map(p =>
            p.id === productId ? { ...p, isActive: !p.isActive } : p
        ));
    };

    const handleDuplicate = (product: Product) => {
        const newProduct: Product = {
            ...product,
            id: `prod-${Date.now()}`,
            name: `${product.name} (Cópia)`,
            salesCount: 0,
        };
        setProducts(prev => [...prev, newProduct]);
    };

    const getTypeColor = (type: string) => {
        const map: Record<string, string> = {
            tuition: 'blue', material: 'green', event: 'violet', other: 'gray'
        };
        return map[type] || 'gray';
    };

    const filteredProducts = activeTab === 'all' ? products : products.filter(p => p.type === activeTab);
    const totalRevenue = products.filter(p => p.isActive).reduce((acc, p) => acc + (p.basePrice * p.salesCount), 0);
    const tuitionProducts = products.filter(p => p.type === 'tuition');
    const activeProducts = products.filter(p => p.isActive);

    return (
        <Stack gap="xl">
            <Group justify="space-between">
                <Group>
                    <Link href="/school" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Catálogo de Produtos 📦</Title>
                        <Text c="dimmed">Mensalidades, materiais e serviços com tiers de preço</Text>
                    </div>
                </Group>
                <Button leftSection={<IconPlus size={16} />} onClick={() => { resetForm(); openModal(); }}>
                    Novo Produto
                </Button>
            </Group>

            {/* KPIs */}
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{products.length}</Text>
                            <Text size="sm" c="dimmed">Total Produtos</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconPackage size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{activeProducts.length}</Text>
                            <Text size="sm" c="dimmed">Ativos</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconCheck size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{tuitionProducts.length}</Text>
                            <Text size="sm" c="dimmed">Mensalidades</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconCurrencyDollar size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>R$ {(totalRevenue / 1000).toFixed(1)}k</Text>
                            <Text size="sm" c="dimmed">Receita Total</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="teal">
                            <IconCurrencyDollar size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">Todos ({products.length})</Tabs.Tab>
                    {PRODUCT_TYPES.map(pt => (
                        <Tabs.Tab key={pt.value} value={pt.value}>
                            {pt.label} ({products.filter(p => p.type === pt.value).length})
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>

            {/* Products Grid */}
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                {filteredProducts.map(product => (
                    <Card key={product.id} shadow="sm" radius="md" p="lg" withBorder style={{ opacity: product.isActive ? 1 : 0.6 }}>
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Badge color={getTypeColor(product.type)} variant="light">
                                    {PRODUCT_TYPES.find(t => t.value === product.type)?.label}
                                </Badge>
                                <Badge color={product.isActive ? 'green' : 'gray'} variant="filled">
                                    {product.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </Group>

                            <div>
                                <Text fw={600} size="lg">{product.name}</Text>
                                <Text size="sm" c="dimmed" lineClamp={2}>{product.description}</Text>
                            </div>

                            {/* Course Link */}
                            {product.courseId && (
                                <Group gap="xs">
                                    <ThemeIcon size="xs" variant="light" color="blue">
                                        <IconLink size={10} />
                                    </ThemeIcon>
                                    <Text size="xs" c="dimmed">
                                        {product.courseName} {product.levelName && `• ${product.levelName}`}
                                    </Text>
                                </Group>
                            )}

                            {/* Pricing */}
                            <Divider />
                            <Group justify="space-between">
                                <div>
                                    <Text size="xs" c="dimmed">Preço base</Text>
                                    <Text size="xl" fw={700} c="blue">R$ {product.basePrice}</Text>
                                </div>
                                {product.pricingTiers.length > 0 && (
                                    <Badge variant="light" color="violet">
                                        {product.pricingTiers.length} tier{product.pricingTiers.length > 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </Group>

                            {/* Pricing Tiers Preview */}
                            {product.pricingTiers.length > 0 && (
                                <Stack gap={4}>
                                    {product.pricingTiers.slice(0, 2).map(tier => (
                                        <Group key={tier.id} justify="space-between">
                                            <Text size="xs">{tier.name}</Text>
                                            <Text size="xs" fw={500}>R$ {tier.price}</Text>
                                        </Group>
                                    ))}
                                    {product.pricingTiers.length > 2 && (
                                        <Text size="xs" c="dimmed">+{product.pricingTiers.length - 2} mais</Text>
                                    )}
                                </Stack>
                            )}

                            {/* Stats */}
                            <Divider />
                            <Group gap="xs">
                                <IconUsers size={14} color="gray" />
                                <Text size="xs" c="dimmed">{product.salesCount} vendas</Text>
                            </Group>

                            {/* Actions */}
                            <Group mt="xs">
                                <Button variant="light" size="xs" leftSection={<IconEdit size={14} />} onClick={() => handleEdit(product)} style={{ flex: 1 }}>
                                    Editar
                                </Button>
                                <ActionIcon variant="light" color="gray" onClick={() => handleDuplicate(product)}>
                                    <IconCopy size={16} />
                                </ActionIcon>
                                <ActionIcon variant="light" color={product.isActive ? 'orange' : 'green'} onClick={() => handleToggleActive(product.id)}>
                                    <IconArchive size={16} />
                                </ActionIcon>
                            </Group>
                        </Stack>
                    </Card>
                ))}
            </SimpleGrid>

            {/* Product Modal */}
            <Modal
                opened={modal}
                onClose={() => { closeModal(); resetForm(); }}
                title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome"
                        placeholder="Ex: Mensalidade Premium"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <Grid>
                        <Grid.Col span={6}>
                            <Select
                                label="Tipo"
                                data={PRODUCT_TYPES}
                                value={productType}
                                onChange={setProductType}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="Preço Base (R$)"
                                value={basePrice}
                                onChange={(v) => setBasePrice(Number(v) || 0)}
                                min={0}
                                decimalScale={2}
                            />
                        </Grid.Col>
                    </Grid>

                    <Textarea
                        label="Descrição"
                        placeholder="Descrição do produto..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                    />

                    <Divider label="Vinculação a Curso" />

                    <Grid>
                        <Grid.Col span={6}>
                            <Select
                                label="Curso"
                                placeholder="Selecione (opcional)"
                                data={COURSES}
                                value={courseId}
                                onChange={setCourseId}
                                clearable
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select
                                label="Nível"
                                placeholder="Selecione (opcional)"
                                data={LEVELS}
                                value={levelId}
                                onChange={setLevelId}
                                clearable
                                disabled={!courseId}
                            />
                        </Grid.Col>
                    </Grid>

                    <Divider label="Tiers de Preço" />

                    {pricingTiers.length > 0 ? (
                        <Stack gap="xs">
                            {pricingTiers.map(tier => (
                                <Paper key={tier.id} p="sm" withBorder radius="md">
                                    <Group justify="space-between">
                                        <div>
                                            <Text fw={500}>{tier.name}</Text>
                                            <Text size="xs" c="dimmed">{tier.description}</Text>
                                            {tier.features.length > 0 && (
                                                <Group gap={4} mt={4}>
                                                    {tier.features.map((f, i) => (
                                                        <Badge key={i} size="xs" variant="light">{f}</Badge>
                                                    ))}
                                                </Group>
                                            )}
                                        </div>
                                        <Group gap="xs">
                                            <Text fw={600} c="blue">R$ {tier.price}</Text>
                                            <ActionIcon variant="light" color="red" size="sm" onClick={() => handleRemoveTier(tier.id)}>
                                                <IconTrash size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    ) : (
                        <Text size="sm" c="dimmed" ta="center" py="md">
                            Nenhum tier de preço. Adicione diferentes opções de pagamento.
                        </Text>
                    )}

                    <Button variant="light" leftSection={<IconPlus size={16} />} onClick={openTierModal}>
                        Adicionar Tier
                    </Button>

                    <Divider />

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => { closeModal(); resetForm(); }}>Cancelar</Button>
                        <Button onClick={handleSave}>{editingProduct ? 'Salvar' : 'Criar'}</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Tier Modal */}
            <Modal opened={tierModal} onClose={closeTierModal} title="Novo Tier de Preço" size="md">
                <Stack gap="md">
                    <TextInput
                        label="Nome do Tier"
                        placeholder="Ex: Anual, Semestral, Premium"
                        value={tierName}
                        onChange={(e) => setTierName(e.target.value)}
                        required
                    />
                    <NumberInput
                        label="Preço (R$)"
                        value={tierPrice}
                        onChange={(v) => setTierPrice(Number(v) || 0)}
                        min={0}
                        decimalScale={2}
                        required
                    />
                    <TextInput
                        label="Descrição"
                        placeholder="Ex: 20% de desconto"
                        value={tierDesc}
                        onChange={(e) => setTierDesc(e.target.value)}
                    />
                    <Textarea
                        label="Benefícios (um por linha)"
                        placeholder="Material incluso\nCancelamento flexível\n..."
                        value={tierFeatures}
                        onChange={(e) => setTierFeatures(e.target.value)}
                        rows={3}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeTierModal}>Cancelar</Button>
                        <Button onClick={handleAddTier}>Adicionar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

