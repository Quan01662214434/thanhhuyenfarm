import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JWT_REFRESH_SERVICE } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessJwt: JwtService,
    @Inject(JWT_REFRESH_SERVICE) private readonly refreshJwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Organization slug already taken');
    const emailTaken = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (emailTaken) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const org = await this.prisma.organization.create({
      data: {
        name: dto.organizationName,
        slug: dto.slug,
        users: {
          create: {
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: UserRole.OWNER,
          },
        },
      },
      include: { users: true },
    });
    const user = org.users[0];
    await this.prisma.rolePermission.create({
      data: { organizationId: org.id, role: UserRole.OWNER, permission: '*' },
    });
    return this.issueTokens(user.id, user.email, user.role, org.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) throw new UnauthorizedException('Account disabled');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.issueTokens(user.id, user.email, user.role, user.organizationId);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; jti: string };
    try {
      payload = await this.refreshJwt.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const hash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, jti: payload.jti, revokedAt: null },
    });
    if (!stored || stored.hashed !== hash || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
    });
    if (!user) throw new UnauthorizedException();
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(user.id, user.email, user.role, user.organizationId);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
    organizationId: string,
  ) {
    const accessTtl = this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
    const jti = randomUUID();
    const accessToken = await this.accessJwt.signAsync({
      sub: userId,
      email,
      role,
      organizationId,
    });
    const refreshToken = await this.refreshJwt.signAsync({ sub: userId, jti });
    const decoded = this.refreshJwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({
      data: {
        userId,
        jti,
        hashed: this.hashToken(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtl,
      user: { id: userId, email, role, organizationId },
    };
  }
}
