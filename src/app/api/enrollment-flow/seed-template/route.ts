import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// ============================================================================
// SEED DEFAULT CONTRACT TEMPLATE
// Gives every SaaS organization a production-ready base contract template
// POST /api/enrollment-flow/seed-template
// ============================================================================

export async function POST(request: NextRequest) {
    const { orgId } = await getApiAuthWithOrg();
    if (!orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Check if a default template already exists
        const existing = await db.get(sql`
            SELECT id FROM contract_templates
            WHERE organization_id = ${orgId} AND is_default = 1
            LIMIT 1
        `) as any;

        if (existing) {
            return NextResponse.json({
                message: 'Template padrão já existe',
                data: { templateId: existing.id, alreadyExists: true },
            });
        }

        const templateId = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);

        // ====================================================================
        // FULL DEFAULT BRAZILIAN EDUCATIONAL SERVICES CONTRACT
        // ====================================================================
        const defaultHtml = `
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; line-height: 1.7; color: #1a1a1a; max-width: 780px; margin: 0 auto; padding: 40px; }
  h1 { text-align: center; font-size: 18px; margin-bottom: 8px; color: #111; }
  h2 { font-size: 14px; margin-top: 28px; margin-bottom: 8px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #333; padding-bottom: 16px; }
  .contract-number { font-size: 12px; color: #666; }
  .parties { background: #f8f9fa; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
  .parties strong { color: #333; }
  .clause { margin-bottom: 16px; text-align: justify; }
  .signatures { margin-top: 48px; }
  .signature-line { border-top: 1px solid #333; width: 300px; margin: 40px auto 8px; }
  .signature-label { text-align: center; font-size: 12px; color: #666; }
  .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 12px; }
  th { background-color: #f5f5f5; font-weight: 600; }
  .highlight { background-color: #fff3cd; padding: 2px 6px; border-radius: 3px; }
</style>

<div class="header">
  <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h1>
  <div class="contract-number">Nº {{NUMERO_CONTRATO}}</div>
</div>

<div class="parties">
  <p><strong>CONTRATADA (Escola):</strong> {{NOME_ESCOLA}}<br>
  CNPJ: {{CNPJ_ESCOLA}}<br>
  Endereço: {{ENDERECO_ESCOLA}}</p>

  <p><strong>CONTRATANTE (Responsável Financeiro):</strong> {{NOME_RESPONSAVEL}}<br>
  CPF: {{CPF_RESPONSAVEL}}<br>
  E-mail: {{EMAIL_RESPONSAVEL}}<br>
  Telefone: {{TELEFONE_RESPONSAVEL}}</p>

  <p><strong>BENEFICIÁRIO (Aluno):</strong> {{NOME_ALUNO}}<br>
  CPF: {{CPF_ALUNO}}<br>
  Data de Nascimento: {{DATA_NASCIMENTO_ALUNO}}</p>
</div>

<h2>CLÁUSULA PRIMEIRA — DO OBJETO</h2>
<div class="clause">
  <p>O presente contrato tem por objeto a prestação de serviços educacionais pela CONTRATADA ao BENEFICIÁRIO, consistindo em aulas regulares do curso <strong>{{NOME_CURSO}}</strong>, na turma <strong>{{NOME_TURMA}}</strong>, com início previsto em <strong>{{DATA_INICIO}}</strong> e término em <strong>{{DATA_FIM}}</strong>.</p>
  <p>O curso terá carga horária conforme grade curricular da turma selecionada, podendo incluir atividades complementares, avaliações e certificação ao final do período.</p>
</div>

<h2>CLÁUSULA SEGUNDA — DA VIGÊNCIA</h2>
<div class="clause">
  <p>Este contrato vigorará pelo período de <strong>{{DURACAO_MESES}} meses</strong>, contados a partir de {{DATA_INICIO}}, podendo ser renovado mediante novo instrumento contratual, por acordo entre as partes, com antecedência mínima de 30 (trinta) dias do término.</p>
</div>

<h2>CLÁUSULA TERCEIRA — DO VALOR E FORMA DE PAGAMENTO</h2>
<div class="clause">
  <p>Pela prestação dos serviços descritos, o CONTRATANTE pagará à CONTRATADA os seguintes valores:</p>
  
  <table>
    <tr><th>Item</th><th>Valor</th></tr>
    <tr><td>Mensalidade</td><td>{{VALOR_MENSAL}}</td></tr>
    <tr><td>Desconto aplicado</td><td>{{DESCONTO_PERCENT}}%</td></tr>
    <tr><td>Valor total do contrato</td><td>{{VALOR_TOTAL}}</td></tr>
    <tr><td>Forma de pagamento</td><td>{{NUM_PARCELAS}}x de {{VALOR_PARCELA}}</td></tr>
  </table>
  
  <p><strong>§1º</strong> — O pagamento deverá ser efetuado até o dia de vencimento de cada parcela, conforme cronograma fornecido no ato da matrícula.</p>
  <p><strong>§2º</strong> — O atraso no pagamento acarretará multa de 2% (dois por cento) sobre o valor da parcela, acrescido de juros de mora de 1% (um por cento) ao mês, calculados pro rata die.</p>
  <p><strong>§3º</strong> — A inadimplência superior a 90 (noventa) dias poderá resultar na suspensão dos serviços educacionais e no registro em órgãos de proteção ao crédito, nos termos da legislação vigente.</p>
</div>

<h2>CLÁUSULA QUARTA — DAS OBRIGAÇÕES DA CONTRATADA</h2>
<div class="clause">
  <p>A CONTRATADA obriga-se a:</p>
  <ol type="a">
    <li>Disponibilizar corpo docente qualificado para ministrar as aulas;</li>
    <li>Fornecer infraestrutura adequada para a realização das atividades;</li>
    <li>Manter o CONTRATANTE informado sobre o progresso acadêmico do BENEFICIÁRIO;</li>
    <li>Emitir certificado de conclusão quando aplicável;</li>
    <li>Respeitar o Código de Defesa do Consumidor e legislação educacional aplicável.</li>
  </ol>
</div>

<h2>CLÁUSULA QUINTA — DAS OBRIGAÇÕES DO CONTRATANTE</h2>
<div class="clause">
  <p>O CONTRATANTE obriga-se a:</p>
  <ol type="a">
    <li>Efetuar os pagamentos nas datas estabelecidas;</li>
    <li>Garantir a frequência do BENEFICIÁRIO às aulas;</li>
    <li>Fornecer informações verdadeiras e atualizadas;</li>
    <li>Comunicar à CONTRATADA qualquer necessidade especial do BENEFICIÁRIO;</li>
    <li>Respeitar as normas internas da instituição.</li>
  </ol>
</div>

<h2>CLÁUSULA SEXTA — DA RESCISÃO</h2>
<div class="clause">
  <p><strong>§1º</strong> — O CONTRATANTE poderá rescindir este contrato a qualquer tempo, mediante comunicação por escrito com antecedência mínima de 30 (trinta) dias, ficando responsável pelo pagamento das parcelas vencidas e proporcionais ao período utilizado.</p>
  <p><strong>§2º</strong> — Em caso de rescisão antecipada, será devida multa de 10% (dez por cento) sobre o saldo remanescente do contrato, observado o disposto no Art. 46 do Código de Defesa do Consumidor.</p>
  <p><strong>§3º</strong> — A CONTRATADA poderá rescindir o contrato por justa causa, em caso de: (a) inadimplência superior a 90 dias; (b) ato de indisciplina grave do BENEFICIÁRIO; (c) descumprimento de cláusula contratual pelo CONTRATANTE.</p>
  <p><strong>§4º</strong> — Em caso de transferência para outra instituição, o CONTRATANTE deverá solicitar documentação com 15 (quinze) dias de antecedência.</p>
</div>

<h2>CLÁUSULA SÉTIMA — DA PROTEÇÃO DE DADOS (LGPD)</h2>
<div class="clause">
  <p>Em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais):</p>
  <p><strong>§1º</strong> — Os dados pessoais coletados serão utilizados exclusivamente para: (a) gestão da prestação de serviços educacionais; (b) comunicação sobre atividades e eventos; (c) emissão de documentos acadêmicos; (d) cobrança; (e) cumprimento de obrigações legais.</p>
  <p><strong>§2º</strong> — A CONTRATADA compromete-se a adotar medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acesso não autorizado, perda ou destruição.</p>
  <p><strong>§3º</strong> — O CONTRATANTE poderá, a qualquer momento, solicitar acesso, correção, portabilidade ou exclusão de seus dados pessoais e do BENEFICIÁRIO, nos termos da LGPD.</p>
  <p><strong>§4º</strong> — A CONTRATADA não compartilhará dados pessoais com terceiros, exceto quando necessário para cumprimento de obrigações legais ou mediante consentimento expresso do CONTRATANTE.</p>
</div>

<h2>CLÁUSULA OITAVA — DAS DISPOSIÇÕES GERAIS</h2>
<div class="clause">
  <p><strong>§1º</strong> — Eventuais alterações neste contrato somente terão validade se feitas por escrito e assinadas por ambas as partes.</p>
  <p><strong>§2º</strong> — A tolerância de uma das partes quanto ao descumprimento de qualquer obrigação pela outra não implicará renúncia ao direito de exigir o cumprimento da obrigação.</p>
  <p><strong>§3º</strong> — Este contrato obriga as partes, seus herdeiros e sucessores a qualquer título.</p>
</div>

<h2>CLÁUSULA NONA — DO FORO</h2>
<div class="clause">
  <p>As partes elegem o Foro da Comarca de {{CIDADE_ESCOLA}}, Estado de {{ESTADO_ESCOLA}}, para dirimir quaisquer dúvidas decorrentes deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.</p>
</div>

<p style="margin-top: 32px;">E por estarem justas e contratadas, as partes firmam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.</p>

<p style="text-align: center; margin-top: 24px;"><strong>{{CIDADE_ESCOLA}}, {{DATA_ASSINATURA}}</strong></p>

<div class="signatures">
  <div style="display: flex; justify-content: space-between; margin-top: 48px;">
    <div style="text-align: center;">
      <div class="signature-line"></div>
      <div class="signature-label"><strong>{{NOME_ESCOLA}}</strong><br>CONTRATADA</div>
    </div>
    <div style="text-align: center;">
      <div class="signature-line"></div>
      <div class="signature-label"><strong>{{NOME_RESPONSAVEL}}</strong><br>CPF: {{CPF_RESPONSAVEL}}<br>CONTRATANTE</div>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; margin-top: 48px;">
    <div style="text-align: center;">
      <div class="signature-line"></div>
      <div class="signature-label">Testemunha 1<br>Nome: ___________________<br>CPF: ___________________</div>
    </div>
    <div style="text-align: center;">
      <div class="signature-line"></div>
      <div class="signature-label">Testemunha 2<br>Nome: ___________________<br>CPF: ___________________</div>
    </div>
  </div>
</div>

<div class="footer">
  <p>Documento gerado eletronicamente por {{NOME_ESCOLA}} — Sistema Node Zero</p>
  <p>Contrato nº {{NUMERO_CONTRATO}} • Gerado em {{DATA_ASSINATURA}}</p>
</div>
`.trim();

        // ====================================================================
        // AVAILABLE VARIABLES DOCUMENTATION
        // ====================================================================
        const variables = JSON.stringify([
            { key: 'NUMERO_CONTRATO', label: 'Número do Contrato', source: 'auto' },
            { key: 'NOME_ESCOLA', label: 'Nome da Escola', source: 'org.name' },
            { key: 'CNPJ_ESCOLA', label: 'CNPJ da Escola', source: 'org.taxId' },
            { key: 'ENDERECO_ESCOLA', label: 'Endereço da Escola', source: 'org.address' },
            { key: 'CIDADE_ESCOLA', label: 'Cidade da Escola', source: 'org.city' },
            { key: 'ESTADO_ESCOLA', label: 'Estado da Escola', source: 'org.state' },
            { key: 'NOME_RESPONSAVEL', label: 'Nome do Responsável', source: 'parent.name' },
            { key: 'CPF_RESPONSAVEL', label: 'CPF do Responsável', source: 'parent.taxId' },
            { key: 'EMAIL_RESPONSAVEL', label: 'E-mail do Responsável', source: 'parent.email' },
            { key: 'TELEFONE_RESPONSAVEL', label: 'Telefone do Responsável', source: 'parent.phone' },
            { key: 'NOME_ALUNO', label: 'Nome do Aluno', source: 'student.name' },
            { key: 'CPF_ALUNO', label: 'CPF do Aluno', source: 'student.taxId' },
            { key: 'DATA_NASCIMENTO_ALUNO', label: 'Data de Nascimento do Aluno', source: 'student.birthDate' },
            { key: 'NOME_CURSO', label: 'Nome do Curso', source: 'courseType.name' },
            { key: 'NOME_TURMA', label: 'Nome da Turma', source: 'class.name' },
            { key: 'VALOR_MENSAL', label: 'Mensalidade (R$)', source: 'payment.monthlyPrice' },
            { key: 'VALOR_TOTAL', label: 'Total do Contrato (R$)', source: 'payment.netTotal' },
            { key: 'NUM_PARCELAS', label: 'Número de Parcelas', source: 'payment.installmentCount' },
            { key: 'VALOR_PARCELA', label: 'Valor da Parcela (R$)', source: 'payment.installmentValue' },
            { key: 'DESCONTO_PERCENT', label: 'Desconto (%)', source: 'payment.discountPercent' },
            { key: 'DURACAO_MESES', label: 'Duração (meses)', source: 'payment.durationMonths' },
            { key: 'DATA_INICIO', label: 'Data de Início', source: 'enrollment.startsAt' },
            { key: 'DATA_FIM', label: 'Data de Término', source: 'enrollment.endsAt' },
            { key: 'DATA_ASSINATURA', label: 'Data da Assinatura', source: 'auto' },
        ]);

        await db.run(sql`
            INSERT INTO contract_templates (
                id, organization_id, name, description,
                contract_type, html_body, variables,
                version, is_default, is_active,
                created_at, updated_at
            ) VALUES (
                ${templateId}, ${orgId},
                ${'Contrato Padrão de Matrícula'},
                ${'Contrato de prestação de serviços educacionais completo com cláusulas de objeto, pagamento, rescisão, LGPD e foro. Modelo padrão para matrículas.'},
                ${'enrollment'},
                ${defaultHtml},
                ${variables},
                ${1},
                ${1},
                ${1},
                ${now}, ${now}
            )
        `);

        return NextResponse.json({
            message: 'Template padrão criado com sucesso',
            data: {
                templateId,
                name: 'Contrato Padrão de Matrícula',
                variableCount: 24,
                clauseCount: 9,
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('[Seed Template] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to seed template' }, { status: 500 });
    }
}
