import { BadRequestException } from '@nestjs/common';
import { FakeBankAdapter } from '../../payments/gateway/fake-bank.adapter';
import { FakeBankSdk } from '../../payments/gateway/fake-bank.sdk';
import { MEMBERSHIP_FACTORIES } from './membership-factory';

describe('membership factories', () => {
  const now = new Date('2026-11-09T10:00:00Z');

  it('creates plans with own rules', () => {
    const single = MEMBERSHIP_FACTORIES.single.issue(1, now);
    expect(single.visitsLeft).toBe(1);
    const monthly = MEMBERSHIP_FACTORIES.monthly.issue(1, now);
    expect(monthly.visitsLeft).toBeNull();
    expect(monthly.validTo!.getTime() - now.getTime()).toBe(30 * 86400_000);
  });

  it('corporate requires company', () => {
    expect(() => MEMBERSHIP_FACTORIES.corporate.issue(1, now)).toThrow(BadRequestException);
    expect(MEMBERSHIP_FACTORIES.corporate.issue(1, now, 'ТОВ Тест').companyName).toBe('ТОВ Тест');
  });
});

describe('payment adapter', () => {
  const gateway = new FakeBankAdapter(new FakeBankSdk());
  const card = { number: '4242 4242 4242 4242', holder: 'T', expiry: '12/29', cvc: '123' };

  it('maps approved charge', async () => {
    const r = await gateway.charge(100, card, 'test');
    expect(r.success).toBe(true);
    expect(r.transactionId).toMatch(/^ch_/);
    expect(await gateway.refund(r.transactionId!)).toBe(true);
  });

  it('maps decline reasons to messages', async () => {
    const r = await gateway.charge(100, { ...card, number: '4000000000000002' }, 'test');
    expect(r).toEqual({ success: false, transactionId: null, error: 'Недостатньо коштів на картці' });
    const expired = await gateway.charge(100, { ...card, expiry: '01/20' }, 'test');
    expect(expired.error).toBe('Термін дії картки минув');
  });
});
