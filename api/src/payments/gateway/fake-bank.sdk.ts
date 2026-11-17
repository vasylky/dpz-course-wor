import { randomUUID } from 'crypto';

// third-party style SDK with its own API shape
export interface FakeBankChargeRequest {
  amountInCents: number;
  currency: 'UAH';
  cardPan: string;
  cardExpiry: string;
  description: string;
}

export interface FakeBankChargeResponse {
  charge_id: string;
  outcome: 'approved' | 'declined';
  decline_reason?: string;
}

export class FakeBankSdk {
  private readonly charges = new Map<string, number>();

  createCharge(req: FakeBankChargeRequest): Promise<FakeBankChargeResponse> {
    const [mm, yy] = req.cardExpiry.split('/').map(Number);
    const now = new Date();
    const expired =
      !mm || !yy || 2000 + yy < now.getFullYear() ||
      (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1);
    if (expired) {
      return Promise.resolve({ charge_id: '', outcome: 'declined', decline_reason: 'card_expired' });
    }
    if (req.cardPan.endsWith('0002')) {
      return Promise.resolve({ charge_id: '', outcome: 'declined', decline_reason: 'insufficient_funds' });
    }
    const id = `ch_${randomUUID().slice(0, 12)}`;
    this.charges.set(id, req.amountInCents);
    return Promise.resolve({ charge_id: id, outcome: 'approved' });
  }

  refundCharge(chargeId: string): Promise<{ refunded: boolean }> {
    return Promise.resolve({ refunded: chargeId.startsWith('ch_') });
  }
}
