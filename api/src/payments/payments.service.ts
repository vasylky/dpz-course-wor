import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type CardDetails, PAYMENT_GATEWAY, type PaymentGateway } from './gateway/payment-gateway';
import { Payment, PaymentPurpose } from './payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
  ) {}

  async charge(
    userId: number,
    purpose: PaymentPurpose,
    referenceId: number | null,
    amount: number,
    card: CardDetails,
    description: string,
  ) {
    const res = await this.gateway.charge(amount, card, description);
    const payment = await this.payments.save(
      this.payments.create({
        user: { id: userId },
        purpose,
        referenceId,
        amount,
        provider: this.gateway.provider,
        transactionId: res.transactionId,
        status: res.success ? 'succeeded' : 'failed',
        error: res.error ?? null,
      }),
    );
    if (!res.success) {
      throw new HttpException(res.error ?? 'Платіж відхилено', HttpStatus.PAYMENT_REQUIRED);
    }
    return payment;
  }

  async refund(purpose: PaymentPurpose, referenceId: number) {
    const payment = await this.payments.findOneBy({ purpose, referenceId, status: 'succeeded' });
    if (!payment?.transactionId) return false;
    if (!(await this.gateway.refund(payment.transactionId))) return false;
    payment.status = 'refunded';
    await this.payments.save(payment);
    return true;
  }

  forUser(userId: number) {
    return this.payments.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }
}
