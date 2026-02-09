import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    enrollments, classes, invoices, contracts, contractParties,
    familyLinks, leads, persons, organizationMemberships, organizations,
    contractTemplates, terms,
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';
import { NotificationTemplates, findStaffToNotify } from '@/lib/notifications';
import { requestSignature, type SignerInfo } from '@/lib/esign';

// POST /api/enrollment-flow/complete
// The atomic cascade: creates everything needed to finalize an enrollment
export async function POST(request: NextRequest) {
    const { personId: staffPersonId, orgId } = await getApiAuthWithOrg();
    if (!staffPersonId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            // Class selection
            classId,

            // Student info
            studentId,          // Existing person ID, or null to create
            studentData,        // {firstName, lastName, email, phone, birthDate, gender} if creating

            // Parent/Responsible info
            parentId,           // Existing person ID, or null to create
            parentData,         // {firstName, lastName, email, phone, taxId, taxIdType} if creating

            // Family link
            relationship,       // 'parent' | 'guardian' | 'grandparent' | etc.

            // Payment plan
            payment: {
                monthlyPrice,
                durationMonths,
                installmentCount,
                discountPercent,
                enrollmentFee,
                installments: installmentSchedule,
                netTotal,
            },

            // Lead reference (if converting from lead)
            leadId,

            // Contract
            templateId,         // Contract template to use (optional)
            signatureProvider,  // 'gov_br' | 'zapsign' | etc.

            // Notes
            notes,
        } = body;

        // ================================================================
        // VALIDATION
        // ================================================================

        if (!classId) {
            return NextResponse.json({ error: 'classId é obrigatório' }, { status: 400 });
        }

        if (!studentId && !studentData) {
            return NextResponse.json({ error: 'studentId ou studentData é obrigatório' }, { status: 400 });
        }

        if (!parentId && !parentData) {
            return NextResponse.json({ error: 'parentId ou parentData é obrigatório' }, { status: 400 });
        }

        // Check class exists and has vacancy
        const classData = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
        if (classData.length === 0) {
            return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 });
        }

        const cls = classData[0];
        if ((cls.currentStudents || 0) >= (cls.maxStudents || 15)) {
            return NextResponse.json({ error: 'Turma lotada. Sem vagas disponíveis.' }, { status: 400 });
        }

        // Get org info for contract
        const orgData = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
        const orgName = orgData[0]?.name || 'Instituição';

        // Get current term
        const currentTerm = await db.select().from(terms)
            .where(and(eq(terms.organizationId, orgId), eq(terms.isCurrent, 1)))
            .limit(1);

        // ================================================================
        // 1. CREATE / RESOLVE STUDENT PERSON
        // ================================================================

        let finalStudentId = studentId;

        if (!finalStudentId && studentData) {
            const newStudent = await db.insert(persons).values({
                firstName: studentData.firstName,
                lastName: studentData.lastName || null,
                primaryEmail: studentData.email || null,
                primaryPhone: studentData.phone || null,
                birthDate: studentData.birthDate ? Math.floor(new Date(studentData.birthDate).getTime() / 1000) : null,
                gender: studentData.gender || null,
                status: 'active',
            }).returning();
            finalStudentId = newStudent[0].id;
        }

        // ================================================================
        // 2. CREATE / RESOLVE PARENT PERSON
        // ================================================================

        let finalParentId = parentId;

        if (!finalParentId && parentData) {
            // Check if parent already exists by CPF or email
            if (parentData.taxId || parentData.email) {
                const existing = await db.select().from(persons).where(
                    sql`${persons.taxId} = ${parentData.taxId?.replace(/[^\d]/g, '') || ''} OR ${persons.primaryEmail} = ${parentData.email || ''}`
                ).limit(1);

                if (existing.length > 0) {
                    finalParentId = existing[0].id;
                }
            }

            if (!finalParentId) {
                const newParent = await db.insert(persons).values({
                    firstName: parentData.firstName,
                    lastName: parentData.lastName || null,
                    primaryEmail: parentData.email || null,
                    primaryPhone: parentData.phone || null,
                    taxId: parentData.taxId ? parentData.taxId.replace(/[^\d]/g, '') : null,
                    taxIdType: parentData.taxIdType || 'cpf',
                    status: 'active',
                }).returning();
                finalParentId = newParent[0].id;
            }
        }

        // ================================================================
        // 3. CREATE FAMILY LINK (if student != parent)
        // ================================================================

        if (finalStudentId !== finalParentId) {
            // Check if link already exists
            const existingLink = await db.select().from(familyLinks)
                .where(and(
                    eq(familyLinks.parentId, finalParentId),
                    eq(familyLinks.studentId, finalStudentId)
                ))
                .limit(1);

            if (existingLink.length === 0) {
                await db.insert(familyLinks).values({
                    parentId: finalParentId,
                    studentId: finalStudentId,
                    relationship: relationship || 'parent',
                    canViewProgress: 1,
                    canViewGrades: 1,
                    canPayInvoices: 1,
                    canCommunicate: 1,
                    isPrimaryContact: 1,
                });
            }
        }

        // ================================================================
        // 4. CREATE ENROLLMENT
        // ================================================================

        const newEnrollment = await db.insert(enrollments).values({
            organizationId: orgId,
            personId: finalStudentId,
            classId,
            termId: currentTerm[0]?.id || cls.termId || null,
            leadId: leadId || null,
            status: 'pending', // Pending until contract is signed
            enrolledAt: Math.floor(Date.now() / 1000),
            startsAt: cls.startsAt,
            endsAt: cls.endsAt,
            notes: notes || null,
        }).returning();

        const enrollmentId = newEnrollment[0].id;

        // ================================================================
        // 5. UPDATE CLASS STUDENT COUNT
        // ================================================================

        await db.update(classes).set({
            currentStudents: (cls.currentStudents || 0) + 1,
            updatedAt: Math.floor(Date.now() / 1000),
        }).where(eq(classes.id, classId));

        // ================================================================
        // 6. GENERATE INVOICES (receivables)
        // ================================================================

        // Get student and parent names for invoice
        const studentPerson = await db.select().from(persons).where(eq(persons.id, finalStudentId)).limit(1);
        const parentPerson = await db.select().from(persons).where(eq(persons.id, finalParentId)).limit(1);

        const studentName = [studentPerson[0]?.firstName, studentPerson[0]?.lastName].filter(Boolean).join(' ');
        const parentName = [parentPerson[0]?.firstName, parentPerson[0]?.lastName].filter(Boolean).join(' ');

        const createdInvoices = [];
        const schedule = installmentSchedule || [];

        for (let i = 0; i < (installmentCount || schedule.length); i++) {
            const installment = schedule[i];
            const dueDate = installment
                ? installment.dueDateTimestamp
                : Math.floor(Date.now() / 1000) + ((i + 1) * 30 * 24 * 60 * 60); // Fallback: monthly

            const amount = installment
                ? installment.amount
                : Math.round((netTotal || monthlyPrice * durationMonths) / installmentCount);

            const invoice = await db.insert(invoices).values({
                organizationId: orgId,
                payerUserId: finalParentId,
                payerName: parentName,
                payerEmail: parentPerson[0]?.primaryEmail || null,
                payerTaxId: parentPerson[0]?.taxId || null,
                studentUserId: finalStudentId,
                studentName,
                courseId: cls.courseId || null,
                description: `Mensalidade ${i + 1}/${installmentCount || schedule.length} - ${cls.name}`,
                grossAmount: monthlyPrice ? monthlyPrice / 100 : amount / 100,
                discountAmount: discountPercent ? (monthlyPrice * discountPercent / 100) / 100 : 0,
                feeAmount: 0,
                netAmount: amount / 100,
                installmentNumber: i + 1,
                totalInstallments: installmentCount || schedule.length,
                dueDate,
                status: 'pending',
            }).returning();

            createdInvoices.push(invoice[0]);
        }

        // ================================================================
        // 7. GENERATE CONTRACT
        // ================================================================

        // Generate contract number
        const now = new Date();
        const contractNumber = `MAT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${enrollmentId.slice(-6).toUpperCase()}`;

        // Load template if provided
        let contractContent = '';
        if (templateId) {
            const template = await db.select().from(contractTemplates)
                .where(eq(contractTemplates.id, templateId))
                .limit(1);

            if (template.length > 0) {
                // Hydrate template variables
                contractContent = template[0].contentMd
                    .replace(/\{\{NOME_ALUNO\}\}/g, studentName)
                    .replace(/\{\{CPF_ALUNO\}\}/g, studentPerson[0]?.taxId || 'N/A')
                    .replace(/\{\{NOME_RESPONSAVEL\}\}/g, parentName)
                    .replace(/\{\{CPF_RESPONSAVEL\}\}/g, parentPerson[0]?.taxId || 'N/A')
                    .replace(/\{\{EMAIL_RESPONSAVEL\}\}/g, parentPerson[0]?.primaryEmail || 'N/A')
                    .replace(/\{\{TELEFONE_RESPONSAVEL\}\}/g, parentPerson[0]?.primaryPhone || 'N/A')
                    .replace(/\{\{NOME_ESCOLA\}\}/g, orgName)
                    .replace(/\{\{NOME_TURMA\}\}/g, cls.name)
                    .replace(/\{\{VALOR_MENSAL\}\}/g, formatCurrency(monthlyPrice || 0))
                    .replace(/\{\{VALOR_TOTAL\}\}/g, formatCurrency(netTotal || 0))
                    .replace(/\{\{NUM_PARCELAS\}\}/g, String(installmentCount || schedule.length))
                    .replace(/\{\{VALOR_PARCELA\}\}/g, formatCurrency(schedule[0]?.amount || 0))
                    .replace(/\{\{DESCONTO_PERCENT\}\}/g, String(discountPercent || 0))
                    .replace(/\{\{DATA_INICIO\}\}/g, cls.startsAt ? new Date(cls.startsAt * 1000).toLocaleDateString('pt-BR') : 'A definir')
                    .replace(/\{\{DATA_FIM\}\}/g, cls.endsAt ? new Date(cls.endsAt * 1000).toLocaleDateString('pt-BR') : 'A definir')
                    .replace(/\{\{DATA_ASSINATURA\}\}/g, now.toLocaleDateString('pt-BR'))
                    .replace(/\{\{NUMERO_CONTRATO\}\}/g, contractNumber);

                // Update template usage count
                await db.update(contractTemplates).set({
                    useCount: (template[0].useCount || 0) + 1,
                    lastUsedAt: Math.floor(Date.now() / 1000),
                }).where(eq(contractTemplates.id, templateId));
            }
        }

        // If no template, generate basic contract HTML
        if (!contractContent) {
            contractContent = generateDefaultContract({
                studentName,
                parentName,
                parentCpf: parentPerson[0]?.taxId || '',
                parentEmail: parentPerson[0]?.primaryEmail || '',
                parentPhone: parentPerson[0]?.primaryPhone || '',
                orgName,
                className: cls.name,
                monthlyPrice: monthlyPrice || 0,
                netTotal: netTotal || 0,
                installmentCount: installmentCount || schedule.length,
                discountPercent: discountPercent || 0,
                contractNumber,
                startDate: cls.startsAt ? new Date(cls.startsAt * 1000).toLocaleDateString('pt-BR') : 'A definir',
                endDate: cls.endsAt ? new Date(cls.endsAt * 1000).toLocaleDateString('pt-BR') : 'A definir',
            });
        }

        const newContract = await db.insert(contracts).values({
            organizationId: orgId,
            enrollmentId,
            personId: finalParentId,
            contractNumber,
            contractType: 'enrollment',
            signerName: parentName,
            signerCpf: parentPerson[0]?.taxId || null,
            signerEmail: parentPerson[0]?.primaryEmail || null,
            signerPhone: parentPerson[0]?.primaryPhone || null,
            responsibleName: finalStudentId !== finalParentId ? studentName : null,
            contentHtml: contractContent,
            totalValueCents: netTotal || 0,
            installments: installmentCount || schedule.length,
            installmentValueCents: schedule[0]?.amount || 0,
            signatureProvider: signatureProvider || 'in_person',
            status: 'generated',
            templateId: templateId || null,
            templateVersion: 1,
            generatedAt: Math.floor(Date.now() / 1000),
            createdBy: staffPersonId,
        }).returning();

        // Create contract parties
        await db.insert(contractParties).values([
            {
                contractId: newContract[0].id,
                personId: finalParentId,
                role: finalStudentId !== finalParentId ? 'responsavel_legal' : 'contratante',
                roleDescription: finalStudentId !== finalParentId ? 'Responsável Legal do Aluno' : 'Contratante',
                isOurClient: 1,
            },
        ]);

        // ================================================================
        // 8. UPDATE LEAD STATUS (if from lead conversion)
        // ================================================================

        if (leadId) {
            await db.update(leads).set({
                status: 'enrolled',
                funnelStage: 'won',
                funnelSegment: 'outcome',
            }).where(eq(leads.id, leadId));
        }

        // ================================================================
        // 9. SEND NOTIFICATIONS
        // ================================================================

        const staffToNotify = await findStaffToNotify(orgId, staffPersonId, 2);

        if (staffToNotify.length) {
            await NotificationTemplates.enrollment(
                orgId,
                staffToNotify,
                studentName,
                cls.name,
                enrollmentId,
            );

            await NotificationTemplates.contractGenerated(
                orgId,
                staffToNotify,
                contractNumber,
                parentName,
                newContract[0].id,
            );
        }

        // ================================================================
        // 10. TRIGGER E-SIGNATURE (if digital provider selected)
        // ================================================================

        let signatureResult = null;
        const chosenProvider = signatureProvider || 'in_person';

        if (chosenProvider !== 'gov_br') {
            const signers: SignerInfo[] = [
                {
                    name: parentName,
                    email: parentPerson[0]?.primaryEmail || '',
                    phone: parentPerson[0]?.primaryPhone || '',
                    taxId: parentPerson[0]?.taxId || '',
                    role: finalStudentId !== finalParentId ? 'responsavel_legal' : 'contratante',
                    authMethod: chosenProvider === 'zapsign' ? 'email_token' : 'screen',
                },
            ];

            try {
                signatureResult = await requestSignature({
                    provider: chosenProvider as any,
                    orgId,
                    contractId: newContract[0].id,
                    contractNumber,
                    documentHtml: contractContent,
                    signers,
                    sendAutomaticEmail: true,
                    expirationDays: 30,
                });
            } catch (e: any) {
                console.error('[Enrollment] E-sign request failed (non-blocking):', e.message);
            }
        }

        // ================================================================
        // RESPONSE
        // ================================================================

        return NextResponse.json({
            data: {
                enrollment: newEnrollment[0],
                contract: {
                    id: newContract[0].id,
                    contractNumber: newContract[0].contractNumber,
                    status: newContract[0].status,
                },
                student: {
                    id: finalStudentId,
                    name: studentName,
                },
                parent: {
                    id: finalParentId,
                    name: parentName,
                },
                invoices: createdInvoices.map(inv => ({
                    id: inv.id,
                    installmentNumber: inv.installmentNumber,
                    dueDate: inv.dueDate,
                    netAmount: inv.netAmount,
                })),
                familyLinkCreated: finalStudentId !== finalParentId,
                leadConverted: !!leadId,
                notifiedStaff: staffToNotify,
                signature: signatureResult ? {
                    provider: signatureResult.provider,
                    success: signatureResult.success,
                    signLinks: signatureResult.signLinks,
                    error: signatureResult.error,
                } : null,
            },
            message: 'Matrícula realizada com sucesso!',
        }, { status: 201 });

    } catch (error) {
        console.error('Error completing enrollment:', error);
        return NextResponse.json({ error: 'Failed to complete enrollment' }, { status: 500 });
    }
}

// ================================================================
// HELPERS
// ================================================================

function formatCurrency(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateDefaultContract(data: {
    studentName: string;
    parentName: string;
    parentCpf: string;
    parentEmail: string;
    parentPhone: string;
    orgName: string;
    className: string;
    monthlyPrice: number;
    netTotal: number;
    installmentCount: number;
    discountPercent: number;
    contractNumber: string;
    startDate: string;
    endDate: string;
}): string {
    const {
        studentName, parentName, parentCpf, parentEmail, parentPhone,
        orgName, className, monthlyPrice, netTotal, installmentCount,
        discountPercent, contractNumber, startDate, endDate,
    } = data;

    return `
# CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

**Contrato Nº:** ${contractNumber}
**Data:** ${new Date().toLocaleDateString('pt-BR')}

---

## CLÁUSULA PRIMEIRA — DAS PARTES

**CONTRATADA:** ${orgName}, pessoa jurídica de direito privado, doravante denominada simplesmente "ESCOLA".

**CONTRATANTE:** ${parentName}, inscrito(a) no CPF sob o nº ${formatCpf(parentCpf)}, e-mail: ${parentEmail}, telefone: ${parentPhone}, doravante denominado(a) "CONTRATANTE"${studentName !== parentName ? `, sendo responsável legal pelo(a) aluno(a) **${studentName}**.` : '.'}

---

## CLÁUSULA SEGUNDA — DO OBJETO

O presente contrato tem por objeto a prestação de serviços educacionais pela ESCOLA ao(à) aluno(a) **${studentName}**, na turma **${className}**, compreendendo o período de ${startDate} a ${endDate}.

---

## CLÁUSULA TERCEIRA — DO VALOR E FORMA DE PAGAMENTO

3.1. O valor total dos serviços educacionais objeto deste contrato é de **${formatCurrency(netTotal)}**, correspondente a **${installmentCount} parcela(s)**.

3.2. O valor da mensalidade base é de **${formatCurrency(monthlyPrice)}**${discountPercent > 0 ? `, com desconto de **${discountPercent}%** aplicado conforme condições negociadas` : ''}.

3.3. O pagamento será efetuado até o dia 10 (dez) de cada mês, através dos meios de pagamento disponibilizados pela ESCOLA (PIX, boleto bancário ou cartão de crédito).

3.4. O atraso no pagamento implicará em multa de 2% (dois por cento) sobre o valor da parcela, acrescido de juros de mora de 1% (um por cento) ao mês, calculados pro rata die.

---

## CLÁUSULA QUARTA — DAS OBRIGAÇÕES DA ESCOLA

4.1. Ministrar as aulas conforme grade horária e calendário escolar.
4.2. Disponibilizar material didático quando previsto no plano do curso.
4.3. Fornecer relatórios de progresso e notas do(a) aluno(a).
4.4. Manter infraestrutura adequada para as atividades pedagógicas.

---

## CLÁUSULA QUINTA — DAS OBRIGAÇÕES DO CONTRATANTE

5.1. Efetuar o pagamento das parcelas nas datas de vencimento.
5.2. Zelar pelo cumprimento das normas internas da ESCOLA.
5.3. Comunicar qualquer alteração de dados cadastrais.
5.4. Acompanhar o desempenho escolar do(a) aluno(a).

---

## CLÁUSULA SEXTA — DA RESCISÃO

6.1. O presente contrato poderá ser rescindido por qualquer das partes mediante comunicação escrita com antecedência mínima de 30 (trinta) dias.

6.2. Em caso de inadimplência superior a 90 (noventa) dias, a ESCOLA poderá rescindir o contrato unilateralmente, sem prejuízo da cobrança dos valores em atraso.

6.3. A rescisão antecipada por parte do CONTRATANTE implicará no pagamento de multa equivalente a 10% (dez por cento) do valor remanescente do contrato.

---

## CLÁUSULA SÉTIMA — DA PROTEÇÃO DE DADOS (LGPD)

7.1. As partes comprometem-se a cumprir a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

7.2. Os dados pessoais coletados serão utilizados exclusivamente para a execução deste contrato e gestão educacional.

7.3. O CONTRATANTE poderá solicitar acesso, correção ou exclusão de seus dados pessoais a qualquer momento.

---

## CLÁUSULA OITAVA — DO FORO

Fica eleito o foro da comarca da sede da ESCOLA para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato.

---

**CONTRATANTE:** ____________________________
${parentName}
CPF: ${formatCpf(parentCpf)}

**CONTRATADA:** ____________________________
${orgName}

**Testemunha 1:** ____________________________

**Testemunha 2:** ____________________________
`.trim();
}

function formatCpf(cpf: string): string {
    if (!cpf || cpf.length !== 11) return cpf || 'N/A';
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}
