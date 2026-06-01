import { SetMetadata } from '@nestjs/common';
import { user_role_enum } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: user_role_enum[]) => SetMetadata(ROLES_KEY, roles);
