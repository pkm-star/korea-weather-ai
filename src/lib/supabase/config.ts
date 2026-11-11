// Supabase 환경변수가 모두 있는지 한 곳에서 판단한다.
// proxy(미들웨어)에서도 import하므로 next/headers 같은 서버 전용 모듈을 넣지 않는다.
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
