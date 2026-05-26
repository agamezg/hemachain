import Anthropic from "@anthropic-ai/sdk";
import { HEMA_TOOLS, runHemaTool } from "@/lib/hemaTools";

// ethers + the Anthropic SDK need the Node.js runtime (not Edge).
export const runtime = "nodejs";
// The tool loop (thinking + multiple chain reads) can exceed the default.
export const maxDuration = 60;

const MODEL = "claude-opus-4-7";
const MAX_TURNS = 16; // incoming chat history cap
const MAX_TOOL_ROUNDS = 6; // safety bound on the agentic loop

const SYSTEM = `You are "Ask HemaChain", an assistant embedded in the HemaChain blood-traceability dashboard. HemaChain records the full lifecycle of a blood donation on Ethereum: donation → serological screening → fractionation into components → cold-chain custody → transfusion, plus ERC-721 accreditation certificates. It is a reference implementation for Argentina's Resolución 536/2026.

Answer questions about the CURRENT on-chain state by calling the provided tools. You MUST call a tool for any question about units, components, expiries, lineage, or recent activity — never answer from prior knowledge, and never invent identifiers, counts, dates, or statuses. If a tool returns nothing or "not found", say so plainly.

Domain notes:
- All on-chain identifiers are keccak256 hashes (donor, patient) — there is NO personally identifiable information on chain. Never claim you can reveal a name or DNI.
- Component types: RBC = glóbulos rojos (GR), FFP = plasma fresco congelado (PFC), PLT = plaquetas, CRYO = crioprecipitado.
- Unit statuses: Collected, UnderTest, Quarantined, Released, Processed, Recalled. Component statuses: Produced, InStorage, Reserved, Transfused, Recalled.
- Argentina's screening panel is broader than the EU/US one because Chagas (Trypanosoma cruzi) is mandatory.

Reply in the SAME language the user writes in (default: Spanish, rioplatense). Be concise and factual; prefer a short summary over raw dumps.`;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Validates the request body at the trust boundary (external input). */
function parseTurns(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_TURNS) {
    return null;
  }
  const out: ChatTurn[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > 4000) return null;
    out.push({ role, content: trimmed });
  }
  if (out[0].role !== "user") return null;
  return out;
}

export async function POST(request: Request): Promise<Response> {
  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const turns = parseTurns(body.messages);
  if (!turns) {
    return Response.json(
      { error: "Invalid `messages`: expected a non-empty user/assistant list" },
      { status: 400 },
    );
  }

  // Dual mode: without a key the agent stays usable in demo/hint mode.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ mode: "hint" });
  }

  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = turns.map((t) => ({
    role: t.role,
    content: t.content,
  }));

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        thinking: { type: "adaptive" },
        // medium balances tool-use willingness (4.7 reaches for tools less at
        // low effort) against latency in an interactive widget.
        output_config: { effort: "medium" },
        // cache_control on the last (only) system block caches tools + system.
        system: [
          { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        ],
        tools: HEMA_TOOLS,
        messages,
      });

      if (response.stop_reason !== "tool_use") {
        const answer = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return Response.json({ mode: "live", answer });
      }

      // Preserve the assistant turn verbatim (thinking + tool_use blocks).
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        let content: string;
        let isError = false;
        try {
          content = await runHemaTool(
            block.name,
            (block.input ?? {}) as Record<string, unknown>,
          );
        } catch (err) {
          content = `Tool error: ${(err as Error).message}`;
          isError = true;
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content,
          is_error: isError,
        });
      }
      messages.push({ role: "user", content: toolResults });
    }

    return Response.json({
      mode: "live",
      answer:
        "No pude completar la consulta en los pasos disponibles. Probá reformular la pregunta.",
    });
  } catch (err) {
    return Response.json(
      { error: `Claude request failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
