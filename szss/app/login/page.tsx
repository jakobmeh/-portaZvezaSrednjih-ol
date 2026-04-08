import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ loginError?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams({ modal: "login" });

  if (params.loginError) {
    next.set("loginError", params.loginError);
  }

  if (params.registered) {
    next.set("registered", params.registered);
  }

  redirect(`/?${next.toString()}`);
}
