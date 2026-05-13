import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getInstance(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    const instance = getInstance();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const PRICES = {
  PRO_MONTHLY: {
    amount: 500,    // 5.00 EUR – 1 mesec
    currency: "eur",
    name: "ŠZSŠ Pro – mesečna naročnina",
    description: "1 mesec Pro dostopa. Ustvari turnirje, upravljaj tekme.",
  },
  SCHOOL: {
    amount: 50000,  // 500.00 EUR – 1 mesec za celo šolo
    currency: "eur",
    name: "ŠZSŠ Šolska licenca",
    description: "Pro za vse dijake šole za 1 mesec. Invite koda za dijake.",
  },
} as const;
