import Link from "next/link";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
} from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; mode?: string }>;
}) {
  const { error, message, mode } = await searchParams;
  const isSignup = mode === "signup";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {isSignup ? "회원가입" : "로그인"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          날씨 즐겨찾기와 채팅을 저장하려면 로그인해주세요.
        </p>
      </div>

      <div className="flex rounded-lg bg-zinc-100 p-1 text-sm font-medium dark:bg-zinc-800">
        <Link
          href="/login"
          className={`flex-1 rounded-md py-1.5 text-center transition-colors ${
            !isSignup
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          로그인
        </Link>
        <Link
          href="/login?mode=signup"
          className={`flex-1 rounded-md py-1.5 text-center transition-colors ${
            isSignup
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          회원가입
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-600 dark:bg-sky-950 dark:text-sky-400">
          {message}
        </p>
      )}

      {isSignup ? (
        <form className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="이메일"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="비밀번호 (8자 이상)"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            formAction={signUpWithPassword}
            className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            회원가입
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="이메일"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="비밀번호"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            formAction={signInWithPassword}
            className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            로그인
          </button>
        </form>
      )}

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        또는
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Google로 로그인
        </button>
      </form>
    </div>
  );
}
