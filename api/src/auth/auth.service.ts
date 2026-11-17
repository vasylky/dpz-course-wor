import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    if (await this.users.existsBy({ email })) {
      throw new ConflictException('Користувач з таким email вже існує');
    }
    const user = await this.users.save(
      this.users.create({
        email,
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        passwordHash: await bcrypt.hash(dto.password, 10),
        preferences: { remindBeforeHours: 24, promoNotifications: true },
      }),
    );
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: dto.email.toLowerCase() })
      .getOne();
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Невірний email або пароль');
    }
    return this.issue(user);
  }

  private issue(user: User) {
    const { passwordHash: _, ...safe } = user;
    return {
      token: this.jwt.sign({ sub: user.id, role: user.role }),
      user: safe,
    };
  }
}
