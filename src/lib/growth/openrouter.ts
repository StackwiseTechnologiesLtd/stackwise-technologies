import { growthAiLog, growthAiLogMultiline } from "@/lib/growth/ai-debug";
import { sanitizeOutboundReply } from "@/lib/growth/ai-reply-sanitize";

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

function openRouterFallbackModel(): string {
  const fallback = process.env.OPENROUTER_FALLBACK_MODEL?.trim();
  return fallback || "google/gemini-2.5-flash";
}

type OpenRouterMessagePayload = {
  content?: unknown;
  reasoning?: string;
  refusal?: string | null;
  reasoning_details?: unknown;
};

type OpenRouterChoice = {
  message?: OpenRouterMessagePayload;
  finish_reason?: string | null;
  native_finish_reason?: string | null;
};

function flattenContent(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => flattenContent(part))
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  if (typeof content === "object") {
    const o = content as Record<string, unknown>;
    if (typeof o.text === "string" && o.text.trim()) return o.text.trim();
    if (typeof o.content === "string" && o.content.trim()) return o.content.trim();
    if (o.parts) return flattenContent(o.parts);
    if (typeof o.value === "string" && o.value.trim()) return o.value.trim();
  }
  return "";
}

function extractFromReasoningDetails(details: unknown): string {
  if (!Array.isArray(details)) return "";
  const chunks: string[] = [];
  for (const item of details) {
    if (!item || typeof item !== "object") continue;
    const block = item as { type?: string; text?: string; content?: string };
    const type = block.type?.toLowerCase() ?? "";
    if (type.includes("reasoning") || type.includes("think")) continue;
    const text = block.text?.trim() || block.content?.trim();
    if (text) chunks.push(text);
  }
  return chunks.join("\n").trim();
}

function extractAssistantText(choice: OpenRouterChoice | undefined): string {
  const message = choice?.message;
  if (!message) return "";

  if (message.refusal?.trim()) {
    growthAiLog("OpenRouter refusal", {
      refusal: message.refusal.slice(0, 300),
    });
    return "";
  }

  const fromContent = flattenContent(message.content);
  if (fromContent) return fromContent;

  const fromDetails = extractFromReasoningDetails(message.reasoning_details);
  if (fromDetails) return fromDetails;

  if (message.reasoning?.trim()) {
    growthAiLog("OpenRouter ignored reasoning field (not user-facing)", {
      reasoningChars: message.reasoning.length,
      finishReason: choice?.finish_reason ?? null,
    });
  }

  return "";
}

function defaultMaxTokens(): number {
  const raw = process.env.GROWTH_OPENROUTER_MAX_TOKENS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 1200;
  return Number.isFinite(n) && n > 0 ? n : 1200;
}

function reasoningDisabled(): boolean {
  return process.env.GROWTH_OPENROUTER_REASONING !== "1";
}

async function openRouterChatForModel(
  model: string,
  messages: OpenRouterMessage[],
  options?: { maxTokens?: number; temperature?: number },
  attempt = 0,
): Promise<{ text: string } | { error: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return { error: "OPENROUTER_API_KEY is not set" };
  }

  const maxTokens =
    options?.maxTokens ??
    (attempt > 0 ? defaultMaxTokens() * 2 : defaultMaxTokens());

  growthAiLog("OpenRouter request", {
    model,
    attempt,
    maxTokens,
    messageCount: messages.length,
    userChars: messages.find((m) => m.role === "user")?.content.length ?? 0,
    reasoningDisabled: reasoningDisabled(),
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "https://stackwise.tech";

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: options?.temperature ?? 0.65,
  };

  if (reasoningDisabled()) {
    body.reasoning = { effort: "none" };
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`,
      "X-Title": "Stackwise Growth",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    error?: { message?: string; code?: number };
    choices?: OpenRouterChoice[];
  };

  if (!res.ok) {
    const detail =
      json.error?.message ??
      `OpenRouter HTTP ${res.status} for model “${model}”`;
    growthAiLog("OpenRouter error", { status: res.status, detail, model });
    return { error: detail };
  }

  const choice = json.choices?.[0];
  const rawText = extractAssistantText(choice);
  const { text, rejectedAsMeta } = sanitizeOutboundReply(rawText);

  if (rejectedAsMeta) {
    growthAiLog("OpenRouter rejected meta-reasoning as reply", {
      model,
      rawChars: rawText.length,
    });
    return {
      error: `Model returned planning text instead of a reply (${model})`,
    };
  }

  if (
    !text &&
    (choice?.finish_reason === "length" ||
      choice?.native_finish_reason === "length") &&
    attempt === 0
  ) {
    growthAiLog("OpenRouter hit length limit — retrying with more tokens", {
      model,
      maxTokens,
    });
    return openRouterChatForModel(model, messages, options, 1);
  }

  if (!text) {
    const content = choice?.message?.content;
    growthAiLog("OpenRouter empty completion", {
      model,
      finishReason: choice?.finish_reason ?? null,
      nativeFinishReason: choice?.native_finish_reason ?? null,
      messageKeys: choice?.message ? Object.keys(choice.message) : [],
      rawContentType:
        content === undefined
          ? "undefined"
          : Array.isArray(content)
            ? "array"
            : typeof content,
      contentPreview:
        content !== undefined && content !== null
          ? JSON.stringify(content).slice(0, 280)
          : null,
    });
    return {
      error: `OpenRouter returned an empty completion (model: ${model}, finish: ${choice?.finish_reason ?? "unknown"})`,
    };
  }

  growthAiLogMultiline(`OpenRouter completion [${model}]`, text);

  return { text };
}

/** Primary model, then optional fallback when the response is empty or errored. */
export async function openRouterChat(
  messages: OpenRouterMessage[],
  options?: { maxTokens?: number; temperature?: number },
): Promise<{ text: string } | { error: string }> {
  const primary = openRouterModel();
  const first = await openRouterChatForModel(primary, messages, options);
  if ("text" in first) return first;

  const fallback = openRouterFallbackModel();
  if (fallback === primary) return first;

  growthAiLog("OpenRouter retry with fallback model", {
    primary,
    fallback,
    reason: first.error,
  });

  const second = await openRouterChatForModel(fallback, messages, options);
  if ("text" in second) return second;

  return {
    error: `${first.error}; fallback (${fallback}): ${second.error}`,
  };
}
