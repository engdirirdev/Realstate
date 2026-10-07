import { prisma } from "@/lib/prisma";

export interface PaymentMethodConfig {
  id: string; // "evc_plus" | "zaad" | "sahal" | "bank_transfer"
  name: string; // "EVC Plus"
  type: "mobile_money" | "bank_transfer";
  accountName: string; // "Kiro-Maal Real Estate"
  accountNumber: string; // "615000001"
  bankName?: string; // "Salaam Somali Bank"
  instructions: string;
  isActive: boolean;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "evc_plus",
    name: "EVC Plus",
    type: "mobile_money",
    accountName: "Kiro-Maal Real Estate",
    accountNumber: "+252 61 500 0001",
    instructions: "Dial *712*615000001*Amount# or use Hormuud EVC Plus to transfer funds. Enter your transaction confirmation code below.",
    isActive: true,
  },
  {
    id: "zaad",
    name: "Zaad",
    type: "mobile_money",
    accountName: "Kiro-Maal Real Estate",
    accountNumber: "+252 63 500 0001",
    instructions: "Dial *220*635000001*Amount# or transfer via Telesom Zaad app. Enter your transaction confirmation code below.",
    isActive: true,
  },
  {
    id: "sahal",
    name: "Sahal",
    type: "mobile_money",
    accountName: "Kiro-Maal Real Estate",
    accountNumber: "+252 90 500 0001",
    instructions: "Dial *880*905000001*Amount# or send via Golis Sahal service. Enter your transaction confirmation code below.",
    isActive: true,
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    type: "bank_transfer",
    bankName: "Salaam Somali Bank",
    accountName: "Kiro-Maal Real Estate",
    accountNumber: "1029384756",
    instructions: "Transfer funds to our Salaam Somali Bank account. Enter your bank transfer reference or receipt number below.",
    isActive: true,
  },
];

const SETTING_KEY = "payment_methods";

/**
 * Fetch centralized payment methods configuration.
 * Stored in SystemSetting table under key "payment_methods".
 */
export async function getPaymentMethodsConfig(onlyActive = true): Promise<PaymentMethodConfig[]> {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    let methods: PaymentMethodConfig[];
    if (record?.value) {
      try {
        methods = JSON.parse(record.value);
        if (!Array.isArray(methods) || methods.length === 0) {
          methods = DEFAULT_PAYMENT_METHODS;
        }
      } catch {
        methods = DEFAULT_PAYMENT_METHODS;
      }
    } else {
      methods = DEFAULT_PAYMENT_METHODS;
      // Seed default methods into system_settings if not present
      await prisma.systemSetting.upsert({
        where: { key: SETTING_KEY },
        update: { value: JSON.stringify(DEFAULT_PAYMENT_METHODS) },
        create: { key: SETTING_KEY, value: JSON.stringify(DEFAULT_PAYMENT_METHODS) },
      });
    }

    if (onlyActive) {
      return methods.filter((m) => m.isActive !== false);
    }
    return methods;
  } catch (error) {
    console.error("[getPaymentMethodsConfig]", error);
    return onlyActive ? DEFAULT_PAYMENT_METHODS.filter((m) => m.isActive) : DEFAULT_PAYMENT_METHODS;
  }
}

/**
 * Update payment methods configuration (Admin only).
 */
export async function savePaymentMethodsConfig(methods: PaymentMethodConfig[]): Promise<PaymentMethodConfig[]> {
  await prisma.systemSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(methods) },
    create: { key: SETTING_KEY, value: JSON.stringify(methods) },
  });
  return methods;
}
