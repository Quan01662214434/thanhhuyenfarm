/** Shared DTOs and enums for FE/BE — keep in sync with Prisma enums where applicable */

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  GUEST = 'GUEST',
}

export enum PlantHealth {
  HEALTHY = 'HEALTHY',
  WATCH = 'WATCH',
  DISEASED = 'DISEASED',
  RECOVERING = 'RECOVERING',
  DEAD = 'DEAD',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
}

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string;
  jti?: string;
};

export type PublicPlantQrPayload = {
  plantId: string;
  token: string;
};
