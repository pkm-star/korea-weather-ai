import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase 설정 전에는 인증 없이 그냥 통과시킴(사이트 전체가 죽는 것 방지).
  const env = getSupabaseEnv();
  if (!env) {
    return response;
  }

  const supabase = createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  // 토큰이 만료 임박이면 여기서 갱신하고, 갱신된 쿠키를 응답에 실어보냄.
  // getClaims()는 토큰 서명을 공개키로 검증하므로 쿠키 값을 그대로 믿지 않으면서도
  // 매 요청마다 Supabase 서버에 왕복하지 않는다.
  // Supabase가 일시정지·장애 상태여도 페이지는 계속 열리도록 예외를 삼킨다.
  try {
    await supabase.auth.getClaims();
  } catch (error) {
    console.error("세션 갱신 실패:", error);
  }

  return response;
}

export const config = {
  matcher: [
    // /api는 제외 — 각 라우트가 필요하면 직접 인증을 검증함(불필요한 Supabase
    // 왕복을 피하기 위함). 예: /api/chat은 로그인 여부와 무관하게 동작.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
