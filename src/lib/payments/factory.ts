/**
 * NodeZero Payment System — Adapter Factory
 * 
 * Resolves the correct adapter implementation based on
 * a gateway's provider field. Decrypts stored credentials
 * before injecting them into the adapter.
 * 
 * Supports 14 providers: 4 PSPs + 10 Banks
 */

import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { paymentGateways } from '@/lib/db/schema';
import { decrypt } from '@/lib/crypto';
import { PaymentAdapter, PaymentAdapterError } from './adapter';
import type { GatewayConfig, PaymentProvider } from './types';

// PSP implementations
import { AsaasAdapter } from './providers/asaas';
import { PagBankAdapter } from './providers/pagbank';
import { MercadoPagoAdapter } from './providers/mercadopago';
import { PagarMeAdapter } from './providers/pagarme';

// Bank implementations
import { InterAdapter } from './providers/inter';
import { BBAdapter } from './providers/bb';
import { ItauAdapter } from './providers/itau';
import { BradescoAdapter } from './providers/bradesco';
import { SantanderAdapter } from './providers/santander';
import { CaixaAdapter } from './providers/caixa';
import { SicrediAdapter } from './providers/sicredi';
import { SicoobAdapter } from './providers/sicoob';
import { SafraAdapter } from './providers/safra';
import { C6BankAdapter } from './providers/c6bank';

/**
 * Get the active payment adapter for an organization.
 */
export async function getAdapterForOrg(organizationId: string): Promise<PaymentAdapter> {
    const [gateway] = await db
        .select()
        .from(paymentGateways)
        .where(
            and(
                eq(paymentGateways.organizationId, organizationId),
                eq(paymentGateways.isActive, true),
            ),
        )
        .limit(1);

    if (!gateway) {
        throw new PaymentAdapterError(
            'factory',
            `No active payment gateway configured for organization ${organizationId}`,
        );
    }

    return createAdapterFromGateway(gateway);
}

/**
 * Create an adapter from a specific gateway record.
 */
export function createAdapterFromGateway(gateway: typeof paymentGateways.$inferSelect): PaymentAdapter {
    const config = decryptGatewayConfig(gateway);
    return createAdapter(config);
}

/**
 * Create an adapter from a decrypted config.
 * Supports all 14 providers.
 */
export function createAdapter(config: GatewayConfig): PaymentAdapter {
    switch (config.provider) {
        // PSPs
        case 'asaas': return new AsaasAdapter(config);
        case 'pagbank': return new PagBankAdapter(config);
        case 'mercadopago': return new MercadoPagoAdapter(config);
        case 'pagarme': return new PagarMeAdapter(config);
        // Banks
        case 'inter': return new InterAdapter(config);
        case 'bb': return new BBAdapter(config);
        case 'itau': return new ItauAdapter(config);
        case 'bradesco': return new BradescoAdapter(config);
        case 'santander': return new SantanderAdapter(config);
        case 'caixa': return new CaixaAdapter(config);
        case 'sicredi': return new SicrediAdapter(config);
        case 'sicoob': return new SicoobAdapter(config);
        case 'safra': return new SafraAdapter(config);
        case 'c6bank': return new C6BankAdapter(config);
        default:
            throw new PaymentAdapterError(
                'factory',
                `Unknown payment provider: ${config.provider}`,
            );
    }
}

/**
 * Decrypt a gateway record's encrypted fields into
 * a clean GatewayConfig object.
 */
function decryptGatewayConfig(gw: typeof paymentGateways.$inferSelect): GatewayConfig {
    return {
        id: gw.id,
        provider: gw.provider as PaymentProvider,
        apiKey: gw.apiKeyEncrypted ? decrypt(gw.apiKeyEncrypted) : '',
        secretKey: gw.secretKeyEncrypted ? decrypt(gw.secretKeyEncrypted) : undefined,
        webhookSecret: gw.webhookSecret || undefined,
        sandboxMode: !gw.isProduction,
    };
}

/**
 * List all supported providers with their capability flags.
 */
export function getSupportedProviders() {
    return [
        // PSPs
        { provider: 'asaas', name: 'Asaas', category: 'psp' as const, recommended: true },
        { provider: 'pagbank', name: 'PagBank (PagSeguro)', category: 'psp' as const, recommended: false },
        { provider: 'mercadopago', name: 'Mercado Pago', category: 'psp' as const, recommended: false },
        { provider: 'pagarme', name: 'Pagar.me', category: 'psp' as const, recommended: false },
        // Banks
        { provider: 'inter', name: 'Banco Inter', category: 'bank' as const, recommended: false },
        { provider: 'bb', name: 'Banco do Brasil', category: 'bank' as const, recommended: false },
        { provider: 'itau', name: 'Itaú Unibanco', category: 'bank' as const, recommended: false },
        { provider: 'bradesco', name: 'Bradesco', category: 'bank' as const, recommended: false },
        { provider: 'santander', name: 'Santander', category: 'bank' as const, recommended: false },
        { provider: 'caixa', name: 'Caixa Econômica', category: 'bank' as const, recommended: false },
        { provider: 'sicredi', name: 'Sicredi', category: 'bank' as const, recommended: false },
        { provider: 'sicoob', name: 'Sicoob', category: 'bank' as const, recommended: false },
        { provider: 'safra', name: 'Banco Safra', category: 'bank' as const, recommended: false },
        { provider: 'c6bank', name: 'C6 Bank', category: 'bank' as const, recommended: false },
    ];
}
