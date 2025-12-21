export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status:
    | 'pending'
    | 'planning'
    | 'in_progress'
    | 'testing'
    | 'reviewing'
    | 'completed'
    | 'failed'
    | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_id: number;
  repository_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
