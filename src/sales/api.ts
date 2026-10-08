export type Page<T> = { content: T[]; totalPages: number; totalElements: number };
export type Opportunity = { id: number; accountId: number; accountName: string; ownerEmail: string | null; viewerRelationships: string[]; origin: string; pipelineMonthlyValue?: number | null; outletCount?: number; expectedValue?: number | null; leadDirection?: string; leadSource?: string | null; stage: string; state: string; ownerId: number | null; priority: string; version: number; createdAt: string; expectedResponseDate: string | null; reactivationDate: string | null };
export type Account = { id: number; name: string; location: string | null; zohoCustomerId: string | null };
export type Product = { outletCount?: number; id: number; description: string; outcome: string; fulfillment: string; expectedMonthlyValue: number | null; stage: string; version: number; zohoProductId: string | null; expectedQuantity: number | null };
export type Task = { id: number; opportunityId: number; assigneeId: number; description: string; dueAt: string; status: string };
export type Event = { id: number; actorId: number; ownerAtEvent: number | null; action: string; reason: string | null; createdAt: string; newValues: string; oldValues: string };
export type Detail = { opportunity: Opportunity; account: Account; products: Product[]; tasks: Task[]; memberships: { userId: number; kind: string }[] };
export type Operation = { id: number; opportunityId: number; kind: string; status: string; scheduledAt: string | null; details: string };
export type Notification = { id: number; opportunityId: number; message: string; readAt: string | null };
export type Capabilities = { userId: number; permissions: string[] };
export function salesApi(base: string, token: string | null, expired: () => void) {
  const retries = new Map<string, string>();
  return async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const retryable = method === 'POST';
    const signature = method + path + JSON.stringify(body);
    if (retryable && !retries.has(signature)) retries.set(signature, crypto.randomUUID());
    const response = await fetch(`${base}/sales${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(retryable ? { 'Idempotency-Key': retries.get(signature)! } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (response.status === 401) expired();
    if (!response.ok) { const problem = await response.json().catch(() => null); throw new Error(problem?.detail || problem?.message || `Request failed (${response.status})`); }
    retries.delete(signature);
    if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T;
    const text = await response.text(); return text ? JSON.parse(text) as T : undefined as T;
  };
}
