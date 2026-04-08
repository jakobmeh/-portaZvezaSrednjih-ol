import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams({ modal: "login" });

  if (params.error) {
    next.set("error", params.error);
  }

  if (params.registered) {
    next.set("registered", params.registered);
  }

  redirect(`/?${next.toString()}`);
}
