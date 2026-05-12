import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nisi prijavljen." }, { status: 401 });

  if (!user.stripeSubscriptionId) {
    // Ni Stripe sub (ročno dodeljen Pro) - samo odstrani Pro
    await prisma.user.update({
      where: { id: user.id },
      data: { isPro: false, proUntil: null },
    });
    return NextResponse.json({ ok: true });
  }

  try {
    // Prekliči ob koncu obdobja (ne takoj)
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
