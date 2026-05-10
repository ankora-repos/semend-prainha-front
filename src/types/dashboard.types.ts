export interface DashboardOverview {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  overdue: number;
}

export interface PeriodData {
  period: string;
  total: number;
}

export interface ResponseTimeData {
  sector_name: string;
  sector_code: string;
  avg_hours_to_receive: number;
  total_received: number;
}

export interface UserActivityData {
  user_name: string;
  email: string;
  total_actions: number;
}

export interface RequestTypeStats {
  name: string;
  total: number;
  onTime: number;
  overdue: number;
}
