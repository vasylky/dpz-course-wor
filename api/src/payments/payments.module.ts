import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FakeBankAdapter } from './gateway/fake-bank.adapter';
import { FakeBankSdk } from './gateway/fake-bank.sdk';
import { PAYMENT_GATEWAY } from './gateway/payment-gateway';
import { Payment } from './payment.entity';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [
    PaymentsService,
    { provide: PAYMENT_GATEWAY, useFactory: () => new FakeBankAdapter(new FakeBankSdk()) },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
