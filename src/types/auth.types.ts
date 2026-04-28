export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
  sectorId: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: Role;
  sector: Sector;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  permissions: Permissions;
  isSuperadmin: boolean;
}

export interface Permissions {
  view: boolean;
  edit: boolean;
  send: boolean;
  receive: boolean;
  approve: boolean;
  reject: boolean;
}

export interface Sector {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}
