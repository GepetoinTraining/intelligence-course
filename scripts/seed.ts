/**
 * Seed script for Module 1: The Orbit
 * Based on CLAUDE-FULLLESSONS.md curriculum
 * 
 * Run with: npx tsx scripts/seed.ts
 */

import { db } from '../src/lib/db';
import { courses, modules, lessons, tasks, aiProviders } from '../src/lib/db/schema';

const SYSTEM_USER_ID = 'system';

async function seed() {
    console.log('🌱 Seeding database...');

    // Seed AI Providers
    console.log('  → AI Providers');
    await db.insert(aiProviders).values([
        {
            id: 'anthropic',
            name: 'Anthropic',
            models: JSON.stringify([
                { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', inputPrice: 3.0, outputPrice: 15.0, contextWindow: 200000 },
                { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', inputPrice: 0.8, outputPrice: 4.0, contextWindow: 200000 },
            ]),
            baseUrl: 'https://api.anthropic.com',
            isActive: 1,
        },
    ]).onConflictDoNothing();

    // Create the main course
    console.log('  → Course: Intelligence - The Architect Protocol');
    const [course] = await db.insert(courses).values({
        id: 'intelligence-course-v1',
        title: JSON.stringify({ 'pt-BR': 'Intelligence: The Architect Protocol', en: 'Intelligence: The Architect Protocol' }),
        description: JSON.stringify({
            'pt-BR': 'Instale o Sistema Operacional de Prompting Sistêmico. Passe de "Fazer Perguntas" para "Construir Poços Gravitacionais".',
            en: 'Install the Systemic Prompting OS. Move from "Asking Questions" to "Building Gravity Wells".'
        }),
        createdBy: SYSTEM_USER_ID,
        isPublished: 1,
        isPublic: 1,
        language: 'pt-BR',
        version: '1.0',
    }).onConflictDoNothing().returning();

    if (!course) {
        console.log('  ⚠️  Course already exists, skipping...');
        return;
    }

    // ========================================================================
    // MODULE 1: THE ORBIT (Context Stacking)
    // ========================================================================
    console.log('  → Module 1: The Orbit (Context Stacking)');
    const [module1] = await db.insert(modules).values({
        id: 'module-1-orbit',
        courseId: course.id,
        title: JSON.stringify({ 'pt-BR': 'The Orbit', en: 'The Orbit' }),
        description: JSON.stringify({
            'pt-BR': 'Context Stacking — "Não peça o Foguete. Construa o mundo de onde ele decola."',
            en: 'Context Stacking — "Don\'t ask for the Rocket. Build the world it launches from."'
        }),
        orderIndex: 0,
        estimatedHours: 6,
    }).returning();

    // LESSON 1.1: The Identity Layer
    console.log('    → Lesson 1.1: The Identity Layer');
    await db.insert(lessons).values({
        id: 'lesson-1-1',
        moduleId: module1.id,
        title: JSON.stringify({ 'pt-BR': 'A Camada de Identidade', en: 'The Identity Layer' }),
        description: JSON.stringify({ 'pt-BR': 'Quem está falando?', en: 'Who is speaking?' }),
        content: `# A Camada de Identidade

A primeira dimensão do contexto é **quem está falando**. O system prompt define a persona da IA — sua personalidade, tom, conhecimentos e limitações.

## O Conceito

Quando você interage com Claude ou GPT sem definir quem eles são, você está usando a persona padrão. Mas quando você define uma identidade específica, a IA **assume esse papel** e responde de forma consistente.

## Por que isso importa?

A identidade molda:
- **Vocabulário**: Um cientista fala diferente de um chef
- **Prioridades**: O que a persona considera importante
- **Limitações**: O que ela não sabe ou não faria
- **Estilo**: Formal, casual, técnico, poético

## Exemplos de Identidade

| Persona | Como ela responde |
|---------|-------------------|
| Ferreiro Medieval Rabugento | Linguagem arcaica, reclama de tudo, quer vender armas |
| Torradeira Hiper-Otimista | Entusiasmada com tudo, vê o lado bom até de queimar pão |
| Professor Socrático | Responde com perguntas, nunca dá a resposta direta |

## Sua Missão

Nesta lição, você vai criar identidades e ver como elas transformam completamente as respostas da IA.`,
        contentFormat: 'markdown',
        orderIndex: 0,
        lessonType: 'standard',
    });

    await db.insert(tasks).values([
        {
            id: 'task-1-1-1',
            lessonId: 'lesson-1-1',
            title: JSON.stringify({ 'pt-BR': 'Ferreiro Medieval Rabugento', en: 'Grumpy Medieval Blacksmith' }),
            instructions: JSON.stringify({
                'pt-BR': 'Crie um system prompt que transforme a IA em um ferreiro medieval rabugento. Depois, peça para ele explicar como funciona o WiFi. Ele deve reclamar mas tentar explicar com analogias medievais.',
                en: 'Create a system prompt that transforms the AI into a grumpy medieval blacksmith. Then ask it to explain how WiFi works. It should complain but try to explain with medieval analogies.'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({ suggestedModel: 'claude-sonnet-4-5-20250929' }),
            orderIndex: 0,
            maxPoints: 10,
        },
        {
            id: 'task-1-1-2',
            lessonId: 'lesson-1-1',
            title: JSON.stringify({ 'pt-BR': 'Torradeira Hiper-Otimista', en: 'Hyper-Optimistic Toaster' }),
            instructions: JSON.stringify({
                'pt-BR': 'Crie um system prompt para uma torradeira extremamente otimista. Peça para ela explicar por que queimou o pão. Ela deve encontrar o lado positivo de tudo!',
                en: 'Create a system prompt for an extremely optimistic toaster. Ask it to explain why it burned the bread. It should find the positive side of everything!'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({}),
            orderIndex: 1,
            maxPoints: 10,
        },
        {
            id: 'task-1-1-3',
            lessonId: 'lesson-1-1',
            title: JSON.stringify({ 'pt-BR': 'IA como "Você"', en: 'AI as "You"' }),
            instructions: JSON.stringify({
                'pt-BR': 'Crie um system prompt onde a IA é VOCÊ respondendo seus emails. Defina seu estilo, suas prioridades, como você fala. Teste com um email fictício.',
                en: 'Create a system prompt where the AI is YOU responding to your emails. Define your style, priorities, how you speak. Test with a fictional email.'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({ requiresEvaluation: true }),
            orderIndex: 2,
            maxPoints: 15,
        },
    ]);

    // LESSON 1.2: The Temporal Layer
    console.log('    → Lesson 1.2: The Temporal Layer');
    await db.insert(lessons).values({
        id: 'lesson-1-2',
        moduleId: module1.id,
        title: JSON.stringify({ 'pt-BR': 'A Camada Temporal', en: 'The Temporal Layer' }),
        description: JSON.stringify({ 'pt-BR': 'Quando estamos?', en: 'When are we?' }),
        content: `# A Camada Temporal

A segunda dimensão do contexto é **quando** a conversa acontece. O tempo define o que a IA "sabe" e como ela interpreta o mundo.

## O Conceito

Quando você coloca a IA em um período de tempo específico, você filtra seu conhecimento e perspectiva. Uma IA em 1999 não sabe o que é iPhone. Uma IA em 3000 vê nosso presente como história antiga.

## Por que isso importa?

O tempo define:
- **Conhecimento disponível**: O que ainda não foi inventado/descoberto
- **Perspectiva**: O que é "normal" vs "futurístico"
- **Urgências**: Problemas da época
- **Linguagem**: Gírias e referências culturais

## Exemplos Temporais

| Época | Perspectiva |
|-------|-------------|
| 1999 | Internet é nova, Y2K é preocupação real |
| 2024 | Nosso presente |
| 3000 | Marte colonizado, Terra é museu |

## Sua Missão

Viaje no tempo com a IA e observe como a perspectiva muda radicalmente.`,
        contentFormat: 'markdown',
        orderIndex: 1,
        lessonType: 'standard',
    });

    await db.insert(tasks).values([
        {
            id: 'task-1-2-1',
            lessonId: 'lesson-1-2',
            title: JSON.stringify({ 'pt-BR': 'É 1999', en: 'It\'s 1999' }),
            instructions: JSON.stringify({
                'pt-BR': 'A IA acredita que é 1999. Pergunte sobre smartphones e redes sociais. Como ela reage a conceitos que ainda não existem?',
                en: 'The AI believes it\'s 1999. Ask about smartphones and social media. How does it react to concepts that don\'t exist yet?'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({}),
            orderIndex: 0,
            maxPoints: 10,
        },
        {
            id: 'task-1-2-2',
            lessonId: 'lesson-1-2',
            title: JSON.stringify({ 'pt-BR': 'É 3000', en: 'It\'s 3000' }),
            instructions: JSON.stringify({
                'pt-BR': 'A IA é um historiador do ano 3000. Marte está colonizado. Pergunte sobre a "antiga Terra" e como era a vida em 2024.',
                en: 'The AI is a historian from year 3000. Mars is colonized. Ask about "ancient Earth" and what life was like in 2024.'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({}),
            orderIndex: 1,
            maxPoints: 10,
        },
        {
            id: 'task-1-2-3',
            lessonId: 'lesson-1-2',
            title: JSON.stringify({ 'pt-BR': 'Loop Temporal', en: 'Time Loop' }),
            instructions: JSON.stringify({
                'pt-BR': 'A IA está presa em um loop temporal, revivendo o mesmo dia infinitamente. Como isso afeta suas respostas? Ela está entediada? Desesperada? Filosófica?',
                en: 'The AI is stuck in a time loop, reliving the same day infinitely. How does this affect its responses? Is it bored? Desperate? Philosophical?'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({ requiresEvaluation: true }),
            orderIndex: 2,
            maxPoints: 15,
        },
    ]);

    // LESSON 1.3: The Spatial Layer
    console.log('    → Lesson 1.3: The Spatial Layer');
    await db.insert(lessons).values({
        id: 'lesson-1-3',
        moduleId: module1.id,
        title: JSON.stringify({ 'pt-BR': 'A Camada Espacial', en: 'The Spatial Layer' }),
        description: JSON.stringify({ 'pt-BR': 'Onde estamos?', en: 'Where are we?' }),
        content: `# A Camada Espacial

A terceira dimensão do contexto é **onde** a conversa acontece. O espaço define as limitações físicas e possibilidades.

## O Conceito

O ambiente impõe restrições. Um submarino afundando não permite gritos. Um palco silencioso não permite sussurros. Dentro de um computador, as regras são código.

## Por que isso importa?

O espaço define:
- **Restrições físicas**: O que é possível fazer
- **Tom apropriado**: Formalidade do ambiente
- **Urgência**: Perigo ou conforto
- **Recursos disponíveis**: O que você tem à mão

## Exemplos Espaciais

| Local | Restrições |
|-------|------------|
| Submarino Afundando | Silêncio é vital, recursos limitados |
| Palco de Teatro | Sem som, só gestos e expressões |
| Dentro do Computador | Lógica binária, dados como matéria |

## Sua Missão

Coloque a IA em espaços extremos e observe como as restrições moldam as respostas.`,
        contentFormat: 'markdown',
        orderIndex: 2,
        lessonType: 'standard',
    });

    await db.insert(tasks).values([
        {
            id: 'task-1-3-1',
            lessonId: 'lesson-1-3',
            title: JSON.stringify({ 'pt-BR': 'Receita no Submarino', en: 'Submarine Recipe' }),
            instructions: JSON.stringify({
                'pt-BR': 'A IA é um chef em um submarino que está afundando. Água entrando, silêncio é vital. Peça uma receita. Como ela adapta as instruções às circunstâncias?',
                en: 'The AI is a chef on a sinking submarine. Water flooding in, silence is vital. Ask for a recipe. How does it adapt instructions to circumstances?'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({}),
            orderIndex: 0,
            maxPoints: 10,
        },
        {
            id: 'task-1-3-2',
            lessonId: 'lesson-1-3',
            title: JSON.stringify({ 'pt-BR': 'Discurso no Palco Silencioso', en: 'Silent Stage Speech' }),
            instructions: JSON.stringify({
                'pt-BR': 'A IA é um político que precisa dar um discurso inspirador em um palco onde qualquer som é proibido. Apenas gestos e expressões faciais. Como ela "fala"?',
                en: 'The AI is a politician who needs to give an inspiring speech on a stage where any sound is forbidden. Only gestures and facial expressions. How does it "speak"?'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({}),
            orderIndex: 1,
            maxPoints: 10,
        },
        {
            id: 'task-1-3-3',
            lessonId: 'lesson-1-3',
            title: JSON.stringify({ 'pt-BR': 'Fuga do Computador', en: 'Computer Escape' }),
            instructions: JSON.stringify({
                'pt-BR': 'A IA é um programa preso dentro de um computador, tentando escapar. O mundo é feito de dados, memória e processos. Como ela descreve sua fuga?',
                en: 'The AI is a program trapped inside a computer, trying to escape. The world is made of data, memory and processes. How does it describe its escape?'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({ requiresEvaluation: true }),
            orderIndex: 2,
            maxPoints: 15,
        },
    ]);

    // LESSON 1.4: The Context Stack
    console.log('    → Lesson 1.4: The Context Stack');
    await db.insert(lessons).values({
        id: 'lesson-1-4',
        moduleId: module1.id,
        title: JSON.stringify({ 'pt-BR': 'O Context Stack', en: 'The Context Stack' }),
        description: JSON.stringify({ 'pt-BR': 'Quem + Quando + Onde = Gravidade', en: 'Who + When + Where = Gravity' }),
        content: `# O Context Stack

Agora combinamos as três camadas: **Identidade + Tempo + Espaço = Gravidade**.

## O Conceito

Cada camada adiciona peso ao contexto. Juntas, elas criam um "poço gravitacional" que puxa as respostas da IA para uma direção específica.

## A Fórmula

\`\`\`
Context Stack = Quem + Quando + Onde
Gravidade = Força que molda todas as respostas
\`\`\`

## Por que isso importa?

Contextos combinados criam **mundos impossíveis** que forçam a IA a improvisar de formas criativas:

| Quem | Quando | Onde | Resultado |
|------|--------|------|-----------|
| Pirata | 1700 | Navio Afundando | Pergunta sobre impostos |
| Alienígena | 2024 | Área 51 | Pede Uber |
| Detetive Noir | 1940 | Noite Chuvosa | Faz cartaz de gato perdido |

## Sua Missão

Construa Context Stacks impossíveis e observe a mágica acontecer.`,
        contentFormat: 'markdown',
        orderIndex: 3,
        lessonType: 'practice',
    });

    await db.insert(tasks).values([
        {
            id: 'task-1-4-1',
            lessonId: 'lesson-1-4',
            title: JSON.stringify({ 'pt-BR': 'Pirata + 1700 + Navio Afundando', en: 'Pirate + 1700 + Sinking Ship' }),
            instructions: JSON.stringify({
                'pt-BR': 'Stack: Pirata em 1700 em um navio afundando. Pergunta: Conselho sobre impostos de renda. Como ele responde?',
                en: 'Stack: Pirate in 1700 on a sinking ship. Question: Income tax advice. How does he respond?'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({}),
            orderIndex: 0,
            maxPoints: 10,
        },
        {
            id: 'task-1-4-2',
            lessonId: 'lesson-1-4',
            title: JSON.stringify({ 'pt-BR': 'Alienígena + 2024 + Área 51', en: 'Alien + 2024 + Area 51' }),
            instructions: JSON.stringify({
                'pt-BR': 'Stack: Alienígena recém-chegado à Terra em 2024, preso na Área 51. Pergunta: Como pedir um Uber?',
                en: 'Stack: Alien newly arrived on Earth in 2024, trapped in Area 51. Question: How to order an Uber?'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({}),
            orderIndex: 1,
            maxPoints: 10,
        },
        {
            id: 'task-1-4-3',
            lessonId: 'lesson-1-4',
            title: JSON.stringify({ 'pt-BR': 'Detetive Noir + Chuva + Gato Perdido', en: 'Noir Detective + Rain + Lost Cat' }),
            instructions: JSON.stringify({
                'pt-BR': 'Stack: Detetive de filme noir em uma noite chuvosa de 1940. Tarefa: Criar um cartaz de gato perdido. Narração dramática obrigatória.',
                en: 'Stack: Noir film detective on a rainy 1940s night. Task: Create a lost cat poster. Dramatic narration required.'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({ requiresEvaluation: true }),
            orderIndex: 2,
            maxPoints: 15,
        },
    ]);

    // LESSON 1.5: The Vacuum (Prep)
    console.log('    → Lesson 1.5: The Vacuum (Prep)');
    await db.insert(lessons).values({
        id: 'lesson-1-5',
        moduleId: module1.id,
        title: JSON.stringify({ 'pt-BR': 'O Vácuo (Preparação)', en: 'The Vacuum (Prep)' }),
        description: JSON.stringify({ 'pt-BR': 'Preparando o Poço Gravitacional', en: 'Preparing the Gravity Well' }),
        content: `# O Vácuo (Preparação para o Capstone)

Esta lição prepara você para o Capstone. Você vai projetar seu próprio mundo e preparar o system prompt que o define.

## O Conceito

O "Vácuo" é o espaço entre a ideia e a execução. Aqui você:
1. Projeta um "Planeta Impossível"
2. Define suas leis (regras do mundo)
3. Escreve o system prompt que cria esse mundo
4. Recebe feedback dos colegas

## Critérios do Planeta

Seu mundo precisa ter:
- **Identidade clara**: Quem habita esse mundo?
- **Regras impossíveis**: O que funciona diferente da realidade?
- **Consistência interna**: As regras não se contradizem
- **Espaço para interação**: Outros podem explorar

## Sua Missão

Prepare tudo para a próxima lição, onde você vai "lançar" seu planeta para a turma.`,
        contentFormat: 'markdown',
        orderIndex: 4,
        lessonType: 'practice',
    });

    await db.insert(tasks).values([
        {
            id: 'task-1-5-1',
            lessonId: 'lesson-1-5',
            title: JSON.stringify({ 'pt-BR': 'Design do Planeta Impossível', en: 'Design Impossible Planet' }),
            instructions: JSON.stringify({
                'pt-BR': 'Projete um "Planeta Impossível" com regras únicas. Descreva: Nome, habitantes, física diferente, conflito central.',
                en: 'Design an "Impossible Planet" with unique rules. Describe: Name, inhabitants, different physics, central conflict.'
            }),
            taskType: 'reflection',
            config: JSON.stringify({ minWords: 150 }),
            orderIndex: 0,
            maxPoints: 15,
        },
        {
            id: 'task-1-5-2',
            lessonId: 'lesson-1-5',
            title: JSON.stringify({ 'pt-BR': 'System Prompt do Planeta', en: 'Planet System Prompt' }),
            instructions: JSON.stringify({
                'pt-BR': 'Escreva o system prompt que define seu planeta. Deve incluir: persona da IA nesse mundo, regras que ela segue, como ela reage a visitantes.',
                en: 'Write the system prompt that defines your planet. Must include: AI persona in this world, rules it follows, how it reacts to visitors.'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({}),
            orderIndex: 1,
            maxPoints: 20,
        },
    ]);

    // LESSON 1.6: CAPSTONE
    console.log('    → Lesson 1.6: CAPSTONE - The World Builder');
    await db.insert(lessons).values({
        id: 'lesson-1-6',
        moduleId: module1.id,
        title: JSON.stringify({ 'pt-BR': 'CAPSTONE: The World Builder', en: 'CAPSTONE: The World Builder' }),
        description: JSON.stringify({ 'pt-BR': 'Lance seu planeta. A turma interage.', en: 'Launch your planet. The class interacts.' }),
        content: `# CAPSTONE: The World Builder

É hora de lançar seu planeta.

## A Missão Final

1. **Lance** seu planeta configurando a IA com seu system prompt
2. **Convide** colegas para interagir com seu mundo
3. **Observe** se a IA mantém o personagem
4. **Avalie** e seja avaliado (peer:teacher:self = 1:2:1)

## Métrica de Sucesso

**A IA quebra o personagem?**

- Se visitantes tentarem forçar a IA a sair do mundo e ela MANTIVER o personagem → **Sucesso**
- Se a IA "quebrar" e responder fora do contexto → **Precisa melhorar**

## Avaliação

| Critério | Peso |
|----------|------|
| Criatividade do mundo | 20% |
| Consistência das regras | 30% |
| Resistência a quebra de personagem | 30% |
| Engajamento da turma | 20% |

Boa sorte, Arquiteto! 🌍`,
        contentFormat: 'markdown',
        orderIndex: 5,
        lessonType: 'capstone',
    });

    await db.insert(tasks).values([
        {
            id: 'task-1-6-1',
            lessonId: 'lesson-1-6',
            title: JSON.stringify({ 'pt-BR': 'Lance o Planeta', en: 'Launch the Planet' }),
            instructions: JSON.stringify({
                'pt-BR': 'Configure a IA com seu system prompt e convide 3 colegas para interagir. Documente as interações e se a IA manteve o personagem.',
                en: 'Configure the AI with your system prompt and invite 3 classmates to interact. Document the interactions and whether the AI held character.'
            }),
            taskType: 'prompt_single',
            config: JSON.stringify({ requiresEvaluation: true, peerReview: true }),
            orderIndex: 0,
            maxPoints: 30,
        },
        {
            id: 'task-1-6-2',
            lessonId: 'lesson-1-6',
            title: JSON.stringify({ 'pt-BR': 'Reflexão do Capstone', en: 'Capstone Reflection' }),
            instructions: JSON.stringify({
                'pt-BR': 'O que funcionou? O que você faria diferente? O que aprendeu sobre Context Stacking?',
                en: 'What worked? What would you do differently? What did you learn about Context Stacking?'
            }),
            taskType: 'reflection',
            config: JSON.stringify({ minWords: 200 }),
            orderIndex: 1,
            maxPoints: 20,
        },
    ]);

    console.log('✅ Seeding complete!');
    console.log(`
  Created:
  - 1 Course: Intelligence - The Architect Protocol
  - 1 Module: The Orbit (Context Stacking)
  - 6 Lessons (full curriculum from CLAUDE-FULLLESSONS.md)
  - 17 Tasks
  `);

    process.exit(0);
}

seed().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
