import { FakeBankSdk } from './fake-bank.sdk';
import { CardDetails, ChargeResult, PaymentGateway } from './payment-gateway';

const DECLINE_MESSAGES: Record<string, string> = {
  card_expired: 'Термін дії картки минув',
  insufficient_funds: 'Недостатньо коштів на картці',
};

// Adapter: FakeBankSdk -> PaymentGateway
export class FakeBankAdapter implements PaymentGateway {
  readonly provider = 'fake-bank';

  constructor(private readonly sdk: FakeBankSdk) {}

  async charge(amount: number, card: CardDetails, description: string): Promise<ChargeResult> {
    const res = await this.sdk.createCharge({
      amountInCents: Math.round(amount * 100),
      currency: 'UAH',
      cardPan: card.number.replace(/\s/g, ''),
      cardExpiry: card.expiry,
      description,
    });
    if (res.outcome === 'approved') {
      return { success: true, transactionId: res.charge_id };
    }
    return {
      success: false,
      transactionId: null,
      error: DECLINE_MESSAGES[res.decline_reason ?? ''] ?? 'Платіж відхилено',
    };
  }

  async refund(transactionId: string) {
    return (await this.sdk.refundCharge(transactionId)).refunded;
  }
}
