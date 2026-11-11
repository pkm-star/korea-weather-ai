import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function AuthStatus() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="shrink-0 rounded-full bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
      <span className="max-w-[140px] truncate">{user.email}</span>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
