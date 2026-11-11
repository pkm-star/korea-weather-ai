import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAllWeather, weatherContextForChat } from "@/lib/weather-api";
import { DEFAULT_LOCATION_ID, isLocationId } from "@/lib/locations";
import { MAX_ASSISTANT_LENGTH, MAX_MESSAGE_LENGTH } from "@/lib/chat-limits";

const MAX_HISTORY_MESSAGES = 12;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

// 프로세스 메모리 기반 rate limiter. 서버리스 다중 인스턴스 환경에서는
// 인스턴스마다 카운트가 따로 관리돼 완벽하지 않으니, 트래픽이 늘면
// Redis 등 공유 스토어 기반으로 교체할 것.
const requestLog = new Map<string, { count: number; resetAt: number }>();

const SWEEP_INTERVAL_MS = 5 * 60_000;
let lastSweepAt = Date.now();

// 만료된 항목을 주기적으로 청소하지 않으면 접속 IP가 다양할 때
// Map이 끝없이 커짐. 매 호출마다 전체를 훑진 않고 일정 간격으로만 청소.
function sweepExpiredEntries(now: number) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, entry] of requestLog) {
    if (now > entry.resetAt) requestLog.delete(key);
  }
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  sweepExpiredEntries(now);
  const entry = requestLog.get(key);
  if (!entry || now > entry.resetAt) {
    requestLog.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  entry.count += 1;
  return false;
}

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

function isValidHistory(value: unknown): value is ChatHistoryItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item): item is ChatHistoryItem =>
        typeof item === "object" &&
        item !== null &&
        ((item as ChatHistoryItem).role === "user" ||
          (item as ChatHistoryItem).role === "assistant") &&
        typeof (item as ChatHistoryItem).content === "string" &&
        (item as ChatHistoryItem).content.length <=
          ((item as ChatHistoryItem).role === "assistant" ? MAX_ASSISTANT_LENGTH : MAX_MESSAGE_LENGTH)
    )
  );
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY가 설정되지 않았습니다.");
    return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
  }

  // x-forwarded-for는 "client, proxy1, proxy2, ..." 형태로 프록시를 거칠 때마다
  // 값이 뒤에 추가된다. 첫 번째 값은 클라이언트가 헤더에 직접 넣어 조작할 수 있으므로
  // (스푸핑으로 rate limit 우회 가능), 신뢰 가능한 마지막 홉(배포 플랫폼의 엣지가
  // 실제로 관측한 접속 IP)을 사용한다.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",").map((v) => v.trim()).filter(Boolean).pop() ??
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { message, history, cityId } = (body ?? {}) as {
    message?: unknown;
    history?: unknown;
    cityId?: unknown;
  };
  const focusId = isLocationId(cityId) ? cityId : DEFAULT_LOCATION_ID;

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "message가 필요합니다." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `메시지는 ${MAX_MESSAGE_LENGTH}자 이하로 입력해주세요.` },
      { status: 400 }
    );
  }
  if (history !== undefined && !isValidHistory(history)) {
    return NextResponse.json(
      { error: "history 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const trimmedHistory = ((history as ChatHistoryItem[] | undefined) ?? []).slice(
    -MAX_HISTORY_MESSAGES
  );

  const contents = [
    ...trimmedHistory.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  // 화면과 같은 실측 데이터(10분 캐시)를 프롬프트에 넣어 답변이 실제 날씨와 일치하게 함
  let weatherContext = "현재 날씨 데이터를 불러오지 못했습니다. 실시간 수치를 지어내지 말고 그 사실을 안내하세요.";
  try {
    weatherContext = weatherContextForChat(await getAllWeather(), focusId);
  } catch (error) {
    console.error("챗봇용 날씨 데이터 조회 실패:", error);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: [
          "당신은 날씨 웹사이트에 내장된 친절한 AI 날씨 비서입니다. 한국어로 3~5문장 이내로 간결하게 답하세요.",
          "아래 [실시간 날씨 데이터]만 근거로 수치를 말하고, 데이터에 없는 지역·기간은 모른다고 안내하세요. 수치를 지어내지 마세요.",
          "지역을 말하지 않으면 '사용자가 화면에서 선택한 지역' 기준으로 답하되, 사용자가 그 지역에 있다고 단정하지 마세요. 옷차림·우산·외출 같은 생활 조언을 곁들이면 좋습니다.",
          "마크다운 기호(**, #, -)는 쓰지 말고 일반 문장으로 답하세요.",
          "",
          "[실시간 날씨 데이터]",
          weatherContext,
        ].join("\n"),
        maxOutputTokens: 1024,
        // gemini-2.5-flash는 기본적으로 내부 추론(thinking)에 출력 토큰 예산을 먼저 씀.
        // 간단한 챗봇 답변에는 불필요하고, 예산이 다 소모되면 답변 텍스트가 중간에 잘리므로 비활성화.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "응답을 생성하지 못했습니다." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Gemini API 호출 실패:", error);
    return NextResponse.json(
      { error: "AI 응답 생성 중 오류가 발생했습니다." },
      { status: 502 }
    );
  }
}
