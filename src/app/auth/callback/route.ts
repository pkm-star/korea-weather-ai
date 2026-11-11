import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function redirectToLogin(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  // 다른 로그인 경로와 같은 기준으로, 설정이 없으면 500 대신 안내와 함께 돌려보낸다
  if (!isSupabaseConfigured()) {
    return redirectToLogin(origin, "서버에 로그인 기능이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (error) {
      // Supabase 연결 실패(일시정지·네트워크) 시에도 500 대신 로그인 화면으로
      console.error("로그인 코드 교환 실패:", error);
    }
  }

  return redirectToLogin(origin, "로그인 처리 중 오류가 발생했습니다.");
}
