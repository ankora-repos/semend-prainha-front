export interface LoginRequest {
  email: string;
  password: string;
  slug?: string;
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
  organizationId: string;
  isSuperadmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: Role;
  sector: Sector;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string | null;
  };
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  permissions: Permissions;
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
