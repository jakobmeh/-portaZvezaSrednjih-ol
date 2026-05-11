import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Manjka podpis." }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Neveljaven webhook podpis." }, { status: 400 });
  }

  // Subscription ustvarjena / plačana
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { userId, type, schoolName } = session.metadata ?? {};

    if (type === "pro_monthly" && userId) {
      const proUntil = new Date();
      proUntil.setMonth(proUntil.getMonth() + 1);

      await prisma.user.update({
        where: { id: userId },
        data: {
          isPro: true,
          proUntil,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        },
      });
    }

    if (type === "school" && schoolName) {
      const proUntil = new Date();
      proUntil.setFullYear(proUntil.getFullYear() + 1);
      const token = Array.from({ length: 8 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
      ).join("");

      await (prisma.schoolLicense as any).upsert({
        where: { schoolName },
        create: { schoolName, plan: "UNLIMITED", inviteToken: token, expiresAt: proUntil },
        update: { plan: "UNLIMITED", inviteToken: token, expiresAt: proUntil },
      });

      if (userId) {
        await prisma.notification.create({
          data: {
            userId,
            title: `Šolska licenca aktivirana`,
            content: `Invite koda za dijake: ${token}. Licenca velja do ${proUntil.toLocaleDateString("sl-SI")}.`,
          },
        });
      }
    }
  }

  // Naročnina obnovljena
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as any;
    const customerId = invoice.customer;
    if (!customerId) return NextResponse.json({ received: true });

    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
    if (user) {
      const proUntil = new Date();
      proUntil.setMonth(proUntil.getMonth() + 1);
      await prisma.user.update({
        where: { id: user.id },
        data: { isPro: true, proUntil },
      });
    }
  }

  // Naročnina preklicana / potekla
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as any;
    const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPro: false, proUntil: null, stripeSubscriptionId: null },
      });
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Pro naročnina preklicana",
          content: "Tvoja Pro naročnina je bila preklicana. Dostop do Pro funkcij je zaključen.",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
