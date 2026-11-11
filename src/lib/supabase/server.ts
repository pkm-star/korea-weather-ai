import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/config";

export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    // 호출하는 쪽에서 isSupabaseConfigured()로 먼저 확인해야 한다
    throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 없습니다.");
  }
  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Server Component에서 호출되면 쓰기가 무시될 수 있음
        // (세션 갱신은 proxy.ts가 담당하므로 문제 없음)
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // no-op
        }
      },
    },
  });
}

export interface CurrentUser {
  id: string;
  email: string | null;
}

// 현재 로그인 사용자. 한 요청 안에서 여러 번 불러도 한 번만 계산한다.
// getClaims()는 비대칭 키로 서명된 토큰을 공개키로 직접 검증하므로
// proxy에서 이미 확인한 뒤 다시 확인해도 Supabase 서버 왕복이 생기지 않는다.
// (구형 대칭키(HS256) 프로젝트에서는 라이브러리가 자동으로 서버 확인을 한다)
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!getSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data) return null;
    const { sub, email } = data.claims;
    return { id: sub, email: typeof email === "string" ? email : null };
  } catch (error) {
    // Supabase가 일시정지·장애 상태여도 날씨 화면은 로그아웃 상태로 계속 보여준다
    console.error("로그인 상태 확인 실패:", error);
    return null;
  }
});
