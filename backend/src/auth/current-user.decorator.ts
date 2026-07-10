import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserPayload = {
  id: string;
  username: string;
  role: string;
  tenantId?: string | null;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);