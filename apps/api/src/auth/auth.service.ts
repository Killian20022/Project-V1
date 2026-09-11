import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialsDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: CredentialsDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('Cette adresse e-mail est déjà utilisée');
    const user = await this.prisma.user.create({ data: { email, passwordHash: await hash(dto.password, 12) } });
    return this.session(user.id, user.email);
  }

  async login(dto: CredentialsDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException('E-mail ou mot de passe incorrect');
    return this.session(user.id, user.email);
  }

  private async session(id: string, email: string) {
    return { accessToken: await this.jwt.signAsync({ id, email }), user: { id, email } };
  }
}
