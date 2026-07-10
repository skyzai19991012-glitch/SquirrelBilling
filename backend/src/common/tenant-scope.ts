import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export function isSuperAdmin(user: any) {
  return user?.role === UserRole.SUPER_ADMIN || user?.role === 'SUPER_ADMIN';
}

export function requireTenantId(user: any) {
  if (isSuperAdmin(user)) {
    return null;
  }

  if (!user?.tenantId) {
    throw new ForbiddenException(
      'Tenant context missing. Please logout and login again with tenant admin account.',
    );
  }

  return user.tenantId;
}

export function tenantFilter(user: any) {
  if (isSuperAdmin(user)) {
    return {};
  }

  return {
    tenantId: requireTenantId(user),
  };
}

export function tenantIdForCreate(user: any, dtoTenantId?: string | null) {
  if (isSuperAdmin(user)) {
    if (!dtoTenantId) {
      throw new ForbiddenException(
        'Super admin cannot create ISP data directly. Login as tenant admin or pass tenantId.',
      );
    }

    return dtoTenantId;
  }

  return requireTenantId(user);
}