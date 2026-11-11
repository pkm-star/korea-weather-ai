"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const MIN_PASSWORD_LENGTH = 8;

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    redirect(
      `/login?error=${encodeURIComponent("서버에 로그인 기능이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.")}`
    );
  }
}

function getSiteOrigin(): string {
  // Host 헤더 등 요청 값은 클라이언트가 조작 가능해서 OAuth 리다이렉트처럼
  // 보안이 걸린 용도로는 신뢰하지 않고, 명시적으로 설정한 사이트 URL만 사용.
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    // 배포 환경에서 이 값이 없으면 OAuth/이메일 인증 링크가 조용히
    // localhost로 향해 로그인이 깨지므로, 눈에 띄게 실패시킨다.
    throw new Error(
      "NEXT_PUBLIC_SITE_URL이 설정되지 않았습니다. 배포 환경 변수를 확인해주세요."
    );
  }
  return "http://localhost:3000";
}

export async function signInWithPassword(formData: FormData) {
  assertSupabaseConfigured();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("이메일과 비밀번호를 입력해주세요.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.")}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUpWithPassword(formData: FormData) {
  assertSupabaseConfigured();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(
      `/login?mode=signup&error=${encodeURIComponent("이메일과 비밀번호를 입력해주세요.")}`
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect(
      `/login?mode=signup&error=${encodeURIComponent(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`)}`
    );
  }

  let origin: string;
  try {
    origin = getSiteOrigin();
  } catch {
    redirect(
      `/login?mode=signup&error=${encodeURIComponent("서버 설정 오류로 회원가입을 진행할 수 없어요.")}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`);
  }

  // Supabase 프로젝트의 "Confirm email"이 꺼져 있으면 가입과 동시에
  // session이 발급된다. 이 경우 확인 메일을 보내지 않았으므로 그 안내
  // 문구는 띄우지 않고, 방금 발급된 session은 정리한 뒤 로그인 화면으로
  // 보내 사용자가 직접 로그인하도록 한다.
  if (data.session) {
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect(
      `/login?message=${encodeURIComponent("회원가입이 완료됐어요. 로그인해주세요.")}`
    );
  }

  redirect(
    `/login?message=${encodeURIComponent("가입 확인 이메일을 보냈어요. 메일함을 확인해주세요.")}`
  );
}

export async function signInWithGoogle() {
  assertSupabaseConfigured();

  let origin: string;
  try {
    origin = getSiteOrigin();
  } catch {
    redirect(`/login?error=${encodeURIComponent("서버 설정 오류로 구글 로그인을 시작할 수 없어요.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent("구글 로그인을 시작하지 못했습니다.")}`);
  }

  redirect(data.url);
}

export async function signOut() {
  assertSupabaseConfigured();

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
