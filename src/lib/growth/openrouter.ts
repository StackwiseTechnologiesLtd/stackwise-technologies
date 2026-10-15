export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export function openRouterModel(): string {
  const model = process.env.OPENROUTER_MODEL?.trim();
  return model || "openrouter/auto";
}

export async function openRouterChat(
  messages: OpenRouterMessage[],
  options?: { maxTokens?: number; temperature?: number },
): Promise<{ text: string } | { error: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return { error: "OPENROUTER_API_KEY is not set" };
  }

  const model = openRouterModel();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "https://stackwise.tech";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`,
      "X-Title": "Stackwise Growth",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 600,
      temperature: options?.temperature ?? 0.65,
    }),
  });

  const json = (await res.json()) as {
    error?: { message?: string; code?: number };
    choices?: { message?: { content?: string } }[];
  };

  if (!res.ok) {
    const detail =
      json.error?.message ??
      `OpenRouter HTTP ${res.status} for model “${model}”`;
    return { error: detail };
  }

  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return { error: "OpenRouter returned an empty completion" };
  }

  return { text };
}
