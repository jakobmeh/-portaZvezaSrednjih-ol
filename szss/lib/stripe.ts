import "server-only";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export const PRICES = {
  PRO_MONTHLY: {
    amount: 500,    // 5.00 EUR – 1 mesec
    currency: "eur",
    name: "ŠZSŠ Pro – mesečna naročnina",
    description: "1 mesec Pro dostopa. Ustvari turnirje, upravljaj tekme.",
  },
  SCHOOL: {
    amount: 50000,  // 500.00 EUR – 1 leto za celo šolo
    currency: "eur",
    name: "ŠZSŠ Šolska licenca",
    description: "Pro za vse dijake šole za 1 leto. Invite koda za dijake.",
  },
} as const;
