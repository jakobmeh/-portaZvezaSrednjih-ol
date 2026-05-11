import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { stripe, PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nisi prijavljen." }, { status: 401 });

  const { type, schoolName } = await req.json();
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (type === "pro_monthly") {
    // Subscription mode za mesečno obnavlanje
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: PRICES.PRO_MONTHLY.currency,
            unit_amount: PRICES.PRO_MONTHLY.amount,
            recurring: { interval: "month" },
            product_data: {
              name: PRICES.PRO_MONTHLY.name,
              description: PRICES.PRO_MONTHLY.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/upgrade?payment=cancelled`,
      metadata: { userId: user.id, type: "pro_monthly" },
      customer_email: user.email,
    });
    return NextResponse.json({ url: session.url });
  }

  if (type === "school") {
    const school = schoolName ?? user.schoolName;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: PRICES.SCHOOL.currency,
            unit_amount: PRICES.SCHOOL.amount,
            product_data: {
              name: PRICES.SCHOOL.name,
              description: PRICES.SCHOOL.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/upgrade?payment=cancelled`,
      metadata: { userId: user.id, type: "school", schoolName: school },
      customer_email: user.email,
    });
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: "Neveljaven tip." }, { status: 400 });
}
