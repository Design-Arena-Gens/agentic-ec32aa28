export type VkApiError = { error: { error_code: number; error_msg: string } };
export type VkApiResponse<T> = { response: T } | VkApiError;

const API = "https://api.vk.com/method";
const V = "5.199";

function buildHeaders(token?: string) {
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function vkFetch<T>(method: string, params: Record<string, any>, token?: string): Promise<VkApiResponse<T>> {
  const url = new URL(`${API}/${method}`);
  const merged = { v: V, ...params } as Record<string, any>;
  Object.entries(merged).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString(), {
    headers: buildHeaders(token),
    cache: "no-store",
  });
  return (await res.json()) as VkApiResponse<T>;
}

export async function resolveCityIdByName(name: string, token?: string): Promise<number | undefined> {
  const r = await vkFetch<{ items: Array<{ id: number; title: string }> }>(
    "database.getCities",
    { country_id: 1, q: name, need_all: 0, count: 1 },
    token ?? process.env.VK_TOKEN
  );
  if ("error" in r) return undefined;
  return r.response.items?.[0]?.id;
}
