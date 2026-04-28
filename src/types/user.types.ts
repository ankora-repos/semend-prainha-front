import type { Sector } from './auth.types';

export interface User {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
  sectorId: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sector?: Sector;
  role?: { id: string; name: string; slug: string };
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  registrationNumber: string;
  sectorId: string;
  roleId: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  registrationNumber?: string;
  sectorId?: string;
  roleId?: string;
}
