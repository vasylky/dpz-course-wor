export interface CardDetails {
  number: string;
  holder: string;
  expiry: string;
  cvc: string;
}

export interface ChargeResult {
  success: boolean;
  transactionId: string | null;
  error?: string;
}

export interface PaymentGateway {
  readonly provider: string;
  charge(amount: number, card: CardDetails, description: string): Promise<ChargeResult>;
  refund(transactionId: string): Promise<boolean>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
