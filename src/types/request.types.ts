export type RequestStatus =
  | 'PROTOCOLADO'
  | 'RECEBIDO_PELO_SETOR'
  | 'EM_ANALISE'
  | 'PENDENTE_DOCUMENTO'
  | 'DEFERIDO'
  | 'INDEFERIDO'
  | 'CONCLUIDO';

export interface ProtocolRequest {
  id: string;
  protocolNumber: string;
  requesterId: string;
  sectorOriginId: string;
  requestTypeId: string;
  description: string;
  status: RequestStatus;
  currentSectorId: string;
  deadlineAt: string;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  requesterName?: string | null;
  requesterCpf?: string | null;
  requesterCnpj?: string | null;
  requesterRg?: string | null;
  requesterBirthDate?: string | null;
  requester: { id: string; name: string; registrationNumber: string };
  requestType: { id: string; name: string; slaDays?: number; flow?: string[] };
  currentSector: { id: string; name: string; code: string };
  sectorOrigin?: { id: string; name: string; code: string; isActive?: boolean };
  tramitations?: Tramitation[];
  statusHistory?: StatusHistoryEntry[];
  attachments?: Attachment[];
}

export interface Tramitation {
  id: string;
  requestId: string;
  fromSectorId?: string;
  toSectorId?: string;
  sentByUserId?: string;
  sentAt: string;
  receivedByUserId?: string | null;
  receivedAt?: string | null;
  notes?: string;
  fromSector: { id: string; name: string; code: string; isActive?: boolean };
  toSector: { id: string; name: string; code: string; isActive?: boolean };
  sentBy: { id: string; name: string };
  receivedBy?: { id: string; name: string } | null;
}

export interface StatusHistoryEntry {
  id: string;
  requestId?: string;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  changedByUserId?: string;
  changedBy: { id?: string; name: string };
  justification?: string | null;
  changedAt: string;
}

export interface Attachment {
  id: string;
  requestId: string;
  uploadedByUserId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy?: { id: string; name: string };
}

export interface CreateRequestDto {
  requestTypeId: string;
  description: string;
  registrationNumber?: string;
  requesterName?: string;
  requesterCpf?: string;
  requesterCnpj?: string;
  requesterRg?: string;
  requesterBirthDate?: string;
}

export interface ForwardDto {
  toSectorCode: string;
  notes?: string;
}

export interface ChangeStatusDto {
  status: RequestStatus;
  justification?: string;
}

export interface ListRequestsParams {
  search?: string;
  status?: RequestStatus;
  sectorCode?: string;
  requestTypeId?: string;
  from?: string;
  to?: string;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RequestType {
  id: string;
  name: string;
  slaDays: number;
  flow: string[];
  isActive: boolean;
  createdByUserId?: string;
  createdAt?: string;
}
