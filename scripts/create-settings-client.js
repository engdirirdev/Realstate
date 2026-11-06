const fs = require('fs');
let code = fs.readFileSync('app/(admin)/admin/settings/page.tsx', 'utf8');

// Replace component name and props
const targetDef = `export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [form, setForm] = useState({
    site_name: "Kiro-Maal Real Estate",
    contact_email: "support@kiromaal.com",
    currency: "USD",
    auto_approve_properties: false,
    enable_ai_chat: true,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);`;

const replDef = `interface AdminSettingsClientProps {
  initialSettings?: {
    site_name: string;
    contact_email: string;
    currency: string;
    auto_approve_properties: boolean;
    enable_ai_chat: boolean;
  };
  initialPaymentMethods?: PaymentMethodConfig[];
}

export default function AdminSettingsClient({
  initialSettings,
  initialPaymentMethods,
}: AdminSettingsClientProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [form, setForm] = useState(
    initialSettings || {
      site_name: "Kiro-Maal Real Estate",
      contact_email: "support@kiromaal.com",
      currency: "USD",
      auto_approve_properties: false,
      enable_ai_chat: true,
    }
  );

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(
    initialPaymentMethods || []
  );`;

code = code.replace(targetDef, replDef);

// Make useEffect skip initial mount if initialSettings were provided
const targetEffect = `  useEffect(() => {
    fetchSettings();
  }, []);`;

const replEffect = `  useEffect(() => {
    if (!initialSettings && !initialPaymentMethods) {
      fetchSettings();
    }
  }, [initialSettings, initialPaymentMethods]);`;

code = code.replace(targetEffect, replEffect);

fs.writeFileSync('components/admin/AdminSettingsClient.tsx', code, 'utf8');
console.log('AdminSettingsClient created successfully');

