export type ApiResult<T> = { success: boolean; data: T; message: string };

export type DictionaryData = {
  statuses: { value: string; label: string }[];
  ranks: { value: string; label: string }[];
  types: string[];
  industries: string[];
  provinces: string[];
};

export type Opportunity = {
  oppId: number;
  oppCode: string;
  oppName: string;
  oppStatus: string;
  oppType: string;
  oppRank: string;
  industry: string;
  oppDesc: string;
  custRelation: string;
  custCode: string;
  custName: string;
  createName: string;
  createDate: string;
  projInvest: number;
  proCost: number;
  profitRate: number;
  terminalCost: number;
  otherCost: number;
  signDate: string;
};

export type OpportunityDetail = {
  opportunity: Opportunity;
  invest: Pick<Opportunity, 'projInvest' | 'proCost' | 'profitRate' | 'terminalCost' | 'otherCost' | 'signDate'>;
  contacts: Contact[];
  visits: Visit[];
};

export type Contact = {
  contactId?: number;
  contactName: string;
  contactPhone: string;
  contactJob: string;
  decisionInflu: string;
  contactType: string;
};

export type Visit = {
  visitId: string;
  oppCode: string;
  custName: string;
  visitObject: string;
  visitTime: string;
  visitPurpose: string;
  nextPlan: string;
  leaderName?: string;
  supportDemand?: string;
  remark?: string;
  createTime?: string;
  photos?: string[];
};

export type VisitAggregate = {
  custName: string;
  oppCode: string;
  oppName: string;
  lastVisitObject: string;
  lastVisitTime: string;
  visitCount: number;
  managerName: string;
  visitStatus: string;
};

export type Customer = {
  custCode: string;
  custName: string;
  province: string;
  industry: string;
  creditCode: string;
  custDesc: string;
  contactName: string;
  contactPhone: string;
  managerName: string;
  opportunityCount?: number;
  visitCount?: number;
  opportunities?: Opportunity[];
  visits?: Visit[];
};

export type DashboardData = {
  metrics: {
    totalOpportunities: number;
    activeOpportunities: number;
    convertedOpportunities: number;
    totalAmountWan: number;
    outputCustomers: number;
    conversionRate: number;
  };
  funnel: { status: string; label: string; count: number; amount: number }[];
  visitTrend: { month: string; visits: number; customers: number }[];
  typePerformance: { type: string; total: number; converted: number; rate: number }[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const result = (await response.json()) as ApiResult<T>;
  if (!response.ok || !result.success) {
    throw new Error(result.message || '请求失败');
  }
  return result.data;
}

export const api = {
  dictionaries: () => request<DictionaryData>('/api/dictionaries'),
  dashboard: () => request<DashboardData>('/api/dashboard'),
  opportunities: (query = '') =>
    request<{ items: Opportunity[]; stats: Record<string, number>; stageCounts: Record<string, number> }>(
      `/api/opportunities${query}`
    ),
  opportunity: (id: string | number) => request<OpportunityDetail>(`/api/opportunities/${id}`),
  createOpportunity: (body: unknown) =>
    request<Opportunity>('/api/opportunities', { method: 'POST', body: JSON.stringify(body) }),
  updateOpportunity: (id: string | number, body: unknown) =>
    request<Opportunity>(`/api/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  transitionOpportunity: (id: string | number, action: string) =>
    request<Opportunity>(`/api/opportunities/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),
  visits: (query = '') =>
    request<{ items: VisitAggregate[]; stats: Record<string, number> }>(`/api/visits${query}`),
  createVisit: (body: unknown) => request<Visit>('/api/visits', { method: 'POST', body: JSON.stringify(body) }),
  customers: (query = '') => request<{ items: Customer[] }>(`/api/customers${query}`),
  customer: (code: string) => request<Customer>(`/api/customers/${code}`),
  createCustomer: (body: unknown) =>
    request<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (code: string, body: unknown) =>
    request<Customer>(`/api/customers/${code}`, { method: 'PUT', body: JSON.stringify(body) }),
};

export function formatMoneyWan(value: number) {
  return `${Number(value || 0).toLocaleString('zh-CN')} 万`;
}

export function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('zh-CN');
}
