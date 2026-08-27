"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  Droplets,
  Receipt,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type IconComponent = typeof Zap;

type Category = keyof typeof BILLERS;

type Biller = {
  name: string;
  description: string;
};

const CATEGORIES: {
  label: Category;
  icon: IconComponent;
}[] = [
  {
    label: "Electric",
    icon: Zap,
  },
  {
    label: "Water",
    icon: Droplets,
  },
  {
    label: "Internet",
    icon: Wifi,
  },
  {
    label: "Credit Card",
    icon: CreditCard,
  },
];

const BILLERS = {
  Electric: [
    {
      name: "Meralco",
      description: "Power Utility Partner",
    },
    {
      name: "AboitizPower",
      description: "Power Utility Partner",
    },
  ],

  Water: [
    {
      name: "Manila Water",
      description: "Water Utility Partner",
    },
    {
      name: "Maynilad",
      description: "Water Utility Partner",
    },
  ],

  Internet: [
    {
      name: "PLDT",
      description: "Internet Service Provider",
    },
    {
      name: "Converge",
      description: "Internet Service Provider",
    },
  ],

  "Credit Card": [
    {
      name: "BDO Credit Card",
      description: "Credit Card Payment",
    },
    {
      name: "BPI Credit Card",
      description: "Credit Card Payment",
    },
  ],
} satisfies Record<string, Biller[]>;

const onlyDigits = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

const formatAmount = (value: string) => {
  if (!value) return "₱0.00";

  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const maskAccountNumber = (value: string) => {
  if (value.length <= 4) return value;

  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
};

const generateReference = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `GB-${random}`;
};

const getTransactionDate = () =>
  new Date().toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function BillsPage() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [selectedBiller, setSelectedBiller] =
    useState<string | null>(null);

  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");

  const [showReceipt, setShowReceipt] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");

  const billers = selectedCategory
    ? BILLERS[selectedCategory]
    : [];

  const selectedBillerDetails = billers.find(
    (biller) => biller.name === selectedBiller,
  );

  const canPay =
    Boolean(selectedCategory) &&
    Boolean(selectedBiller) &&
    accountNumber.length > 0 &&
    amount.length > 0 &&
    Number(amount) > 0;

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setSelectedBiller(null);
  };

  const handleAccountNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAccountNumber(
      onlyDigits(event.target.value, 12),
    );
  };

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAmount(onlyDigits(event.target.value, 6));
  };

  const handlePayNow = () => {
    if (!canPay) return;

    setReferenceNumber(generateReference());
    setShowReceipt(true);
  };

  const handleDone = () => {
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="mx-auto min-h-screen w-full max-w-[440px] px-5 pb-28">
        <header className="relative flex h-16 items-center justify-center">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="absolute left-0 grid h-10 w-10 place-items-center rounded-full bg-surface-sunken text-ink-soft transition-colors hover:bg-surface-raised"
          >
            <ArrowLeft size={18} strokeWidth={1.9} />
          </Link>

          <div className="text-center">
            <h1 className="text-[16px] font-semibold tracking-tight">
              Pay Bills
            </h1>

            <p className="mt-0.5 text-[11px] text-ink-soft">
              Pay your bills easily
            </p>
          </div>
        </header>

        <section className="mt-4">
          <SectionTitle>
            What do you want to pay?
          </SectionTitle>

          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((category) => (
              <CategoryCard
                key={category.label}
                category={category.label}
                icon={category.icon}
                selected={
                  selectedCategory === category.label
                }
                onClick={() =>
                  handleCategorySelect(category.label)
                }
              />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <SectionTitle>Select Biller</SectionTitle>

          {!selectedCategory ? (
            <EmptyState>
              Select a bill category first
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {billers.map((biller) => (
                <BillerCard
                  key={biller.name}
                  biller={biller}
                  icon={
                    CATEGORIES.find(
                      (category) =>
                        category.label === selectedCategory,
                    )?.icon ?? Zap
                  }
                  selected={
                    selectedBiller === biller.name
                  }
                  onClick={() =>
                    setSelectedBiller(biller.name)
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-6">
          <SectionTitle>Payment Details</SectionTitle>

          <div className="space-y-4">
            <Field
              label="Account Number"
              value={accountNumber}
              placeholder="Enter your account number"
              maxLength={12}
              count={`${accountNumber.length}/12`}
              hint="Maximum of 12 digits."
              onChange={handleAccountNumberChange}
            />

            <Field
              label="Amount to Pay"
              value={amount}
              placeholder="Enter amount"
              maxLength={6}
              count={`${amount.length}/6`}
              hint="Maximum of 6 digits."
              prefix="₱"
              onChange={handleAmountChange}
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-surface-raised p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[12px] font-semibold">
              Payment Summary
            </h2>

            <span className="rounded-full bg-[#eafaf5] px-2.5 py-1 text-[9px] font-medium text-[#00a77d]">
              No Fee
            </span>
          </div>

          <SummaryRow
            label="Category"
            value={selectedCategory ?? "Not selected"}
          />

          <SummaryRow
            label="Biller"
            value={
              selectedBillerDetails?.name ??
              "Not selected"
            }
          />

          <SummaryRow
            label="Service fee"
            value="₱0.00"
            valueClassName="text-[#00a77d]"
          />

          <div className="my-3 border-t border-black/[0.05]" />

          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold">
              Total
            </span>

            <span className="text-[17px] font-semibold tracking-tight">
              {formatAmount(amount)}
            </span>
          </div>
        </section>

        <button
          type="button"
          disabled={!canPay}
          onClick={handlePayNow}
          className={`mt-5 h-12 w-full rounded-xl text-[13px] font-semibold transition-all ${
            canPay
              ? "bg-[#00b98b] text-white shadow-[0_8px_20px_-10px_rgba(0,185,139,0.8)] hover:bg-[#00a77d] active:scale-[0.99]"
              : "cursor-not-allowed bg-surface-sunken text-ink-soft/50"
          }`}
        >
          {canPay
            ? "Pay Now"
            : "Enter Payment Details"}
        </button>

        <p className="mt-3 text-center text-[9.5px] text-ink-soft/60">
          Please review your payment details before
          continuing.
        </p>
      </div>

      {showReceipt && (
        <ReceiptModal
          amount={formatAmount(amount)}
          biller={selectedBillerDetails?.name ?? ""}
          category={selectedCategory ?? ""}
          accountNumber={maskAccountNumber(accountNumber)}
          referenceNumber={referenceNumber}
          transactionDate={getTransactionDate()}
          onClose={() => setShowReceipt(false)}
          onDone={handleDone}
        />
      )}
    </main>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-3 text-[13px] font-semibold">
      {children}
    </h2>
  );
}

function CategoryCard({
  category,
  icon: Icon,
  selected,
  onClick,
}: {
  category: Category;
  icon: IconComponent;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex min-h-[86px] flex-col items-center justify-center rounded-2xl border px-2 py-3 transition-all ${
        selected
          ? "border-[#00b98b]/30 bg-[#eafaf5]"
          : "border-transparent bg-surface-raised hover:bg-surface-sunken"
      }`}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#00b98b] text-white">
          <Check size={11} strokeWidth={3} />
        </span>
      )}

      <span
        className={`grid h-10 w-10 place-items-center rounded-xl ${
          selected
            ? "bg-[#d5f5eb] text-[#00b98b]"
            : "bg-surface-sunken text-ink-soft"
        }`}
      >
        <Icon size={19} strokeWidth={1.9} />
      </span>

      <span
        className={`mt-2 text-[10px] font-medium ${
          selected
            ? "text-[#00a77d]"
            : "text-ink-soft"
        }`}
      >
        {category}
      </span>
    </button>
  );
}

function BillerCard({
  biller,
  icon: Icon,
  selected,
  onClick,
}: {
  biller: Biller;
  icon: IconComponent;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center rounded-2xl border p-3.5 text-left transition-all ${
        selected
          ? "border-[#00b98b]/30 bg-[#f0fbf8]"
          : "border-transparent bg-surface-raised hover:bg-surface-sunken"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          selected
            ? "bg-[#dff7ef] text-[#00b98b]"
            : "bg-surface-sunken text-ink-soft"
        }`}
      >
        <Icon size={21} strokeWidth={1.9} />
      </span>

      <span className="ml-3 min-w-0 flex-1">
        <span className="block text-[13px] font-semibold">
          {biller.name}
        </span>

        <span className="mt-0.5 block text-[10.5px] text-ink-soft">
          {biller.description}
        </span>
      </span>

      {selected ? (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#00b98b] text-white">
          <Check size={13} strokeWidth={3} />
        </span>
      ) : (
        <ChevronRight
          size={17}
          strokeWidth={1.8}
          className="text-ink-soft"
        />
      )}
    </button>
  );
}

function EmptyState({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[74px] items-center justify-center rounded-2xl bg-surface-raised px-4">
      <p className="text-center text-[11px] text-ink-soft">
        {children}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  maxLength,
  count,
  hint,
  prefix,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  count: string;
  hint: string;
  prefix?: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[11px] font-medium text-ink-soft">
          {label}
        </label>

        <span className="text-[9px] text-ink-soft/60">
          {count}
        </span>
      </div>

      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-ink-soft">
            {prefix}
          </span>
        )}

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border border-transparent bg-surface-raised px-3.5 text-[13px] text-ink outline-none placeholder:text-ink-soft/50 transition-all focus:border-[#00b98b]/40 focus:ring-2 focus:ring-[#00b98b]/10 ${
            prefix ? "pl-8" : ""
          }`}
        />
      </div>

      <p className="mt-1.5 text-[9px] text-ink-soft/60">
        {hint}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className="text-[11px] text-ink-soft">
        {label}
      </span>

      <span
        className={`text-[11px] font-medium ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

function ReceiptModal({
  amount,
  biller,
  category,
  accountNumber,
  referenceNumber,
  transactionDate,
  onClose,
  onDone,
}: {
  amount: string;
  biller: string;
  category: string;
  accountNumber: string;
  referenceNumber: string;
  transactionDate: string;
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:pb-0">
      <div className="w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="relative px-6 pb-5 pt-7 text-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-[#f3f5f6] text-[#69727d] transition-colors hover:bg-[#e9ecef]"
          >
            <X size={16} strokeWidth={2} />
          </button>

          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e5f8f2]">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#00b98b] text-white">
              <Check size={20} strokeWidth={2.8} />
            </div>
          </div>

          <h2 className="mt-4 text-[18px] font-semibold tracking-tight text-[#111827]">
            Payment Successful
          </h2>

          <p className="mt-1 text-[11px] text-[#7b8490]">
            Your bill payment has been processed.
          </p>
        </div>

        <div className="mx-5 rounded-2xl border border-[#edf0f2] bg-[#fafbfb] p-4">
          <div className="border-b border-dashed border-[#dfe4e7] pb-4 text-center">
            <p className="text-[10px] font-medium text-[#8a929c]">
              Amount Paid
            </p>

            <p className="mt-1 text-[27px] font-semibold tracking-tight text-[#111827]">
              {amount}
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <ReceiptRow
              label="Biller"
              value={biller}
            />

            <ReceiptRow
              label="Category"
              value={category}
            />

            <ReceiptRow
              label="Account Number"
              value={accountNumber}
            />

            <ReceiptRow
              label="Service Fee"
              value="₱0.00"
            />

            <ReceiptRow
              label="Date & Time"
              value={transactionDate}
            />

            <ReceiptRow
              label="Reference Number"
              value={referenceNumber}
            />
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Receipt
              size={14}
              strokeWidth={1.8}
              className="text-[#00b98b]"
            />

            <p className="text-[10px] text-[#8a929c]">
              Keep this receipt for your records.
            </p>
          </div>

          <button
            type="button"
            onClick={onDone}
            className="h-12 w-full rounded-xl bg-[#00b98b] text-[13px] font-semibold text-white transition-colors hover:bg-[#00a77d] active:scale-[0.99]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[10.5px] text-[#8a929c]">
        {label}
      </span>

      <span className="max-w-[60%] text-right text-[10.5px] font-medium text-[#202832]">
        {value}
      </span>
    </div>
  );
}