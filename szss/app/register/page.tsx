import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams({ modal: "register" });

  if (params.error) {
    next.set("error", params.error);
  }

  redirect(`/?${next.toString()}`);
}
