import { IsString, Length, Matches } from 'class-validator';

export class CardDto {
  @Matches(/^(\d{4} ?){4}$/, { message: 'Номер картки має містити 16 цифр' })
  number: string;

  @IsString()
  @Length(2, 60)
  holder: string;

  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Термін дії у форматі MM/YY' })
  expiry: string;

  @Matches(/^\d{3}$/, { message: 'CVC має містити 3 цифри' })
  cvc: string;
}
