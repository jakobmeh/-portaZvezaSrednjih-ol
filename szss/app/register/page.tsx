import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ registerError?: string }>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams({ modal: "register" });

  if (params.registerError) {
    next.set("registerError", params.registerError);
  }

  redirect(`/?${next.toString()}`);
}
