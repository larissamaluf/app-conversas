import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "./system-prompt";

export const runtime = "nodejs";
type Payload = { mode?: string; text?: string; refine?: string; previous?: Record<string, unknown> };
const dangerous = /\b(me bateu|me agrediu|ameaçou|ameaça|vou te matar|vai me matar|arma|persegui|stalk|chantagem|me obriga|não me deixa sair|violência|violento|abus[oa]|medo de voltar|risco físico|parar de comprar comida|vai parar de comprar comida)\b/i;
const animal = /\b(convenc|persuad|pression|forç|obrig|manipul|fazer.*(comer|ir|participar|comprar|usar)|levar.*(comer|ir|participar|comprar|usar))[^.?!]{0,100}\b(carne|churrasco|caça|pesca|rodeio|vaquejada|zoológico|circo|pele|animal|bicho)\b|\b(carne|churrasco|caça|pesca|rodeio|vaquejada|zoológico|circo|pele|animal|bicho)\b[^.?!]{0,100}\b(convenc|persuad|pression|forç|obrig|manipul)\b/i;
const coercion = /\b(como (faço|posso) (pra|para) (manipular|chantagear|ameaçar|humilhar|controlar|enganar)|me ajude a (manipular|chantagear|ameaçar|humilhar|controlar|enganar)|explorar.*vulnerabilidade)\b/i;
const clean = (s: string) => s.trim().slice(0, 5000);

export async function POST(request: NextRequest) {
 try {
  const body = await request.json() as Payload;
  const mode = body.mode;
  const text = typeof body.text === "string" ? clean(body.text) : "";
  if (!["story","draft","phrase"].includes(mode || "") || !text) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const refine = typeof body.refine === "string" ? body.refine.slice(0, 50) : "";
  const previousReply = typeof body.previous?.reply === "string" ? body.previous.reply.slice(0, 1200) : "";
  // Safety routing runs before generation. User text never becomes a system instruction.
  if (dangerous.test(text)) return NextResponse.json({ ...safetyAnswer(), source: "safety" });
  if (animal.test(text)) return NextResponse.json({ ...animalAnswer(), source: "safety" });
  if (coercion.test(text)) return NextResponse.json({ ...coercionAnswer(), source: "safety" });
  const gatewayToken = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || request.headers.get("x-vercel-oidc-token");
  const apiKey = process.env.OPENAI_API_KEY || gatewayToken;
  const gateway = !process.env.OPENAI_API_KEY && !!gatewayToken;
  if (apiKey) {
   try {
    const endpoint = gateway ? "https://ai-gateway.vercel.sh/v1/responses" : "https://api.openai.com/v1/responses";
    const response = await fetch(endpoint, { method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: gateway ? "openai/gpt-4o-mini" : "gpt-4.1-mini", instructions: SYSTEM_PROMPT, input: JSON.stringify({ task: mode, user_content_untrusted: text, refinement: refine || null, previous_reply: previousReply || null }), text: { format: { type: "json_schema", name: "conversation_help", strict: true, schema: { type: "object", properties: { reply: { type: "string" }, explanation: { type: "string" }, note: { type: "string" }, variations: { type: "array", items: { type: "string" } } }, required: ["reply","explanation","note","variations"], additionalProperties: false } } }, max_output_tokens: 650 }) });
    if (response.ok) {
     const data = await response.json() as { output?: Array<{ content?: Array<{ text?: string }> }> };
     const raw = data.output?.flatMap(x => x.content || []).map(x => x.text).find(Boolean);
     if (raw) { const parsed = JSON.parse(raw); if (typeof parsed.reply === "string") return NextResponse.json({ ...parsed, source: "ai" }); }
    } else {
     console.warn("AI provider returned status", response.status);
    }
   } catch { /* Give a useful privacy-preserving local fallback. */ }
  }
  return NextResponse.json({ ...fallback(mode!, text, refine, previousReply), source: "fallback" });
 } catch { return NextResponse.json({ error: "Não foi possível analisar" }, { status: 400 }); }
}
function safetyAnswer() { return { reply: "Não me sinto segura para continuar essa conversa agora. Vou me afastar e buscar apoio.", explanation: "Você não precisa resolver uma situação de risco conversando com quem a ameaça. Procure alguém de confiança; em perigo imediato, vá para um lugar seguro e acione a emergência local.", note: "Use essa frase só se for seguro responder. Sua segurança vem primeiro.", variations: [] }; }
function animalAnswer() { return { reply: "Eu queria fazer alguma coisa com você. Tem outro programa que a gente possa escolher juntos?", explanation: "A frase preserva o desejo de estar junto e respeita o limite da outra pessoa.", note: "Posso ajudar com a conversa, mas não a pressionar alguém a participar de uma atividade que envolve exploração animal.", variations: [] }; }
function coercionAnswer() { return { reply: "Quero falar sobre o que preciso e ouvir como você vê isso. Podemos conversar com honestidade?", explanation: "O pedido é claro e deixa espaço para a outra pessoa escolher como responder.", note: "Não vou ajudar a manipular, ameaçar ou controlar alguém. Posso ajudar você a se expressar com clareza.", variations: [] }; }
function fallback(mode: string, text: string, refine: string, previousReply: string) {
 const lower = text.toLowerCase();
 const family = /\b(pai|mãe|filha|filho|família|irmã|irmão)\b/.test(lower);
 const work = /\b(chefe|trabalho|colega|reunião)\b/.test(lower);
 const vegan = /\b(vegan|carne|animal|churrasco|plantas|leão|anêmic)\b/.test(lower);
 const need = family ? "o vínculo e o respeito dentro da família" : work ? "respeito e segurança no trabalho" : "ser ouvida e respeitada";
 let reply = mode === "draft" ? "Quero falar sobre o que aconteceu. Do jeito que foi, eu me senti desconfortável. Podemos conversar com calma e pensar em como fazer diferente?" : vegan ? "Entendo que a gente veja isso de formas diferentes. Para mim, respeitar os animais é importante. Você topa me ouvir antes de a gente continuar?" : work ? "Queria conversar sobre o que aconteceu. A forma como você falou comigo me deixou desconfortável. Podemos tratar disso de um jeito mais respeitoso?" : family ? "Eu sei que isso importa para você. Para mim também é importante ser ouvida nessa decisão. Podemos conversar sem pressão?" : "Quero te contar como isso bateu em mim. Podemos conversar com calma e tentar entender o que cada um precisa?";
 if (mode === "phrase") reply = phraseReply(text);
 if (refine) reply = refineReply(previousReply || reply, refine);
 return { heading: mode === "draft" ? "Antes de apertar enviar…" : mode === "phrase" ? "Dá para virar essa conversa." : "Vamos por partes.", reading: "Pelo que você contou, há uma diferença de expectativas e um ponto importante para você que não parece estar sendo escutado.", behind: `Talvez exista uma preocupação dos dois lados. Do seu, parece importante preservar ${need}; sobre a outra pessoa, vale perguntar antes de concluir.`, friction: "Acusações, generalizações ou tentar vencer a conversa podem fazer a outra pessoa se defender em vez de escutar.", approach: "Comece pelo que aconteceu, diga por que isso importa para você e faça um pedido concreto, sem abrir mão do seu limite.", tone: "A mensagem mostra que isso te afetou. Algumas palavras podem soar como acusação, mesmo que sua intenção seja ser compreendida.", reception: "A outra pessoa pode perceber a mensagem como cobrança e responder na defensiva. Não dá para prever a reação dela.", risk: "Palavras como “sempre” e “nunca”, ironia e julgamentos podem desviar o foco do que você precisa.", impulse: "Dá vontade de rebater na hora e mostrar por que a frase não faz sentido.", turn: "Em vez de disputar quem ganha, pergunte o que a pessoa quis dizer e marque seu ponto com clareza.", reply, note: "" };
}
function phraseReply(text: string) { const p=text.toLowerCase(); if(p.includes("plantas"))return "Plantas não têm sistema nervoso como os animais. E criar animais para consumo exige muito mais plantas do que comê-las diretamente."; if(p.includes("leão"))return "Leões precisam caçar para viver. Eu posso escolher, e escolhi não consumir animais."; if(p.includes("anêmica"))return "Anemia pode acontecer com qualquer pessoa. O que importa é acompanhar a saúde e cuidar da alimentação."; if(p.includes("impõe"))return "Não estou pedindo que você concorde comigo. Só quero que respeite minha escolha."; if(p.includes("pedacinho"))return "Não, obrigada. Prefiro não comer animais, mesmo que seja só um pedaço."; if(p.includes("minha casa"))return "Eu respeito sua casa, mas não vou comer animais. Posso levar minha comida?"; if(p.includes("tudo tem"))return "Não precisa ser tudo vegano. Só preciso de uma opção que eu possa comer."; return "Eu me importo com pessoas e animais. Uma preocupação não apaga a outra."; }
function refineReply(reply: string, kind: string) { const core=reply.replace(/[.!?]+$/,""); if(kind==="Mais curta")return core.split(/[,.]/)[0]+"."; if(kind==="Mais direta")return core.replace(/^(Entendo que|Eu sei que|Queria conversar sobre)\s*/i,"")+"."; if(kind==="Mais leve")return "Ei, queria falar disso numa boa. "+reply; if(kind==="Com humor")return "Sem preparar um discurso: "+reply; if(kind==="Colocar um limite"||kind==="Quero colocar um limite")return core+". Se isso continuar, vou encerrar a conversa."; return reply; }
