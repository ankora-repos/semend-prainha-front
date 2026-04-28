import type { AuthUser, Permissions } from '@/types/auth.types';
import type { ProtocolRequest } from '@/types/request.types';

export function canForward(user: AuthUser, request: ProtocolRequest): boolean {
  if (user.role.isSuperadmin) return true;
  return user.role.permissions.send && user.sectorId === request.currentSectorId;
}

export function canReceive(user: AuthUser, request: ProtocolRequest): boolean {
  if (user.role.isSuperadmin) return true;
  return user.role.permissions.receive && user.sectorId === request.currentSectorId;
}

export function canChangeStatus(user: AuthUser): boolean {
  if (user.role.isSuperadmin) return true;
  return user.role.permissions.edit;
}

export function canApprove(user: AuthUser): boolean {
  if (user.role.isSuperadmin) return true;
  return user.role.permissions.approve;
}

export function canReject(user: AuthUser): boolean {
  if (user.role.isSuperadmin) return true;
  return user.role.permissions.reject;
}

export function hasPerm(user: AuthUser | null, perm: keyof Permissions): boolean {
  if (!user) return false;
  if (user.role.isSuperadmin) return true;
  return user.role.permissions[perm] === true;
}

export function getAvailableActions(
  user: AuthUser,
  request: ProtocolRequest,
): Array<'forward' | 'receive' | 'changeStatus'> {
  const actions: Array<'forward' | 'receive' | 'changeStatus'> = [];

  const isTerminal = ['DEFERIDO', 'INDEFERIDO', 'CONCLUIDO'].includes(request.status);
  if (isTerminal) return actions;

  if (canForward(user, request)) actions.push('forward');
  if (canReceive(user, request)) actions.push('receive');
  if (canChangeStatus(user)) actions.push('changeStatus');

  return actions;
}
