"use client";

import {
  ArrowLeft,
  Zap,
  Droplets,
  Wifi,
  CreditCard,
  ChevronRight,
  Check,
  Receipt,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BILLER_CATEGORIES = [
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
};

type Category = keyof typeof BILLERS;

export default function BillsPage() {
  const router = useRouter();

  // Selected bill category
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  // Selected biller
  const [selectedBiller, setSelectedBiller] = useState<string | null>(null);

  // Account number
  const [accountNumber, setAccountNumber] = useState("");

  // Amount
  const [amount, setAmount] = useState("");

  // Receipt
  const [showReceipt, setShowReceipt] = useState(false);

  // Reference number
  const [referenceNumber, setReferenceNumber] = useState("");

  /*
   * Get billers based on the selected category
   */
  const currentBillers = selectedCategory ? BILLERS[selectedCategory] : [];

  /*
   * Get the currently selected biller
   */
  const currentBiller = selectedBiller
    ? currentBillers.find((biller) => biller.name === selectedBiller)
    : null;

  /*
   * Handle category selection
   */
  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);

    // Reset the biller whenever the category changes
    setSelectedBiller(null);
  };

  /*
   * Handle account number
   *
   * Numbers only
   * Maximum of 12 digits
   */
  const handleAccountNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const numericValue = event.target.value.replace(/\D/g, "").slice(0, 12);

    setAccountNumber(numericValue);
  };

  /*
   * Handle amount
   *
   * Numbers only
   * Maximum of 6 digits
   */
  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = event.target.value.replace(/\D/g, "").slice(0, 6);

    setAmount(numericValue);
  };

  /*
   * Format the amount for display
   */
  const formattedAmount = amount
    ? `₱${Number(amount).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "₱0.00";

  /*
   * Check if the user can make the payment
   */
  const canPay =
    selectedCategory !== null &&
    selectedBiller !== null &&
    accountNumber.length > 0 &&
    amount.length > 0 &&
    Number(amount) > 0;

  /*
   * Generate a simple transaction reference number
   */
  const generateReference = () => {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();

    return `GB-${random}`;
  };

  /*
   * Handle Pay Now
   */
  const handlePayNow = () => {
    if (!canPay) return;

    setReferenceNumber(generateReference());
    setShowReceipt(true);
  };

  /*
   * Mask the account number for the receipt
   *
   * Example:
   * 123456789012
   * becomes
   * ********9012
   */
  const maskedAccountNumber =
    accountNumber.length > 4
      ? `${"*".repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
      : accountNumber;

  /*
   * Transaction date and time
   */
  const transactionDate = new Date().toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <main className="bg-surface text-ink min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 pb-28">
        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <header className="relative flex h-16 items-center justify-center">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="bg-surface-sunken text-ink-soft hover:bg-surface-raised absolute left-0 grid h-10 w-10 place-items-center rounded-full transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={1.9} />
          </Link>

          <div className="text-center">
            <h1 className="text-ink text-[16px] font-semibold tracking-tight">
              Pay Bills
            </h1>

            <p className="text-ink-soft mt-0.5 text-[11px]">
              Pay your bills easily
            </p>
          </div>
        </header>

        {/* ===================================================== */}
        {/* BILLER CATEGORIES */}
        {/* ===================================================== */}

        <section className="mt-3">
          <h2 className="text-ink mb-3 text-[13px] font-semibold">
            What do you want to pay?
          </h2>

          <div className="grid grid-cols-4 gap-2.5">
            {BILLER_CATEGORIES.map((category) => {
              const Icon = category.icon;

              const isSelected = selectedCategory === category.label;

              return (
                <button
                  key={category.label}
                  type="button"
                  onClick={() =>
                    handleCategoryChange(category.label as Category)
                  }
                  className={`group relative flex flex-col items-center rounded-2xl border px-2 py-3 transition-all ${
                    isSelected
                      ? "border-[#00b98b]/30 bg-[#eafaf5]"
                      : "bg-surface-raised hover:bg-surface-sunken border-transparent"
                  }`}
                >
                  {/* Selected check */}
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#00b98b] text-white">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}

                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                      isSelected
                        ? "bg-[#d5f5eb] text-[#00b98b]"
                        : "bg-surface-sunken text-ink-soft"
                    }`}
                  >
                    <Icon size={19} strokeWidth={1.9} />
                  </span>

                  <span
                    className={`mt-2 text-[10px] font-medium ${
                      isSelected ? "text-[#00a77d]" : "text-ink-soft"
                    }`}
                  >
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===================================================== */}
        {/* SELECT BILLER */}
        {/* ===================================================== */}

        <section className="mt-6">
          <h2 className="text-ink mb-3 text-[13px] font-semibold">
            Select Biller
          </h2>

          {/* No category selected */}
          {!selectedCategory && (
            <div className="bg-surface-raised flex items-center justify-center rounded-2xl px-4 py-7">
              <p className="text-ink-soft text-center text-[11px]">
                Select a bill category first
              </p>
            </div>
          )}

          {/* Available billers */}
          {selectedCategory && (
            <div className="space-y-2">
              {currentBillers.map((biller) => {
                const isSelected = selectedBiller === biller.name;

                const CategoryIcon =
                  BILLER_CATEGORIES.find(
                    (category) => category.label === selectedCategory,
                  )?.icon ?? Zap;

                return (
                  <button
                    key={biller.name}
                    type="button"
                    onClick={() => setSelectedBiller(biller.name)}
                    className={`flex w-full items-center rounded-2xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-[#00b98b]/30 bg-[#f0fbf8]"
                        : "bg-surface-raised hover:bg-surface-sunken border-transparent"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                        isSelected
                          ? "bg-[#dff7ef] text-[#00b98b]"
                          : "bg-surface-sunken text-ink-soft"
                      }`}
                    >
                      <CategoryIcon size={21} strokeWidth={1.9} />
                    </div>

                    {/* Biller information */}
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-ink text-[13px] font-semibold">
                        {biller.name}
                      </p>

                      <p className="text-ink-soft mt-0.5 text-[10.5px]">
                        {biller.description}
                      </p>
                    </div>

                    {/* Selected indicator */}
                    {isSelected ? (
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
              })}
            </div>
          )}
        </section>

        {/* ===================================================== */}
        {/* PAYMENT DETAILS */}
        {/* ===================================================== */}

        <section className="mt-6">
          <h2 className="text-ink mb-3 text-[13px] font-semibold">
            Payment Details
          </h2>

          <div className="space-y-4">
            {/* Account Number */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="account-number"
                  className="text-ink-soft text-[11px] font-medium"
                >
                  Account Number
                </label>

                <span className="text-ink-soft/60 text-[9px]">
                  {accountNumber.length}/12
                </span>
              </div>

              <input
                id="account-number"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                value={accountNumber}
                onChange={handleAccountNumberChange}
                placeholder="Enter your account number"
                className="bg-surface-raised text-ink placeholder:text-ink-soft/50 h-12 w-full rounded-xl border border-transparent px-3.5 text-[13px] transition-all outline-none focus:border-[#00b98b]/40 focus:ring-2 focus:ring-[#00b98b]/10"
              />

              <p className="text-ink-soft/60 mt-1.5 text-[9px]">
                Maximum of 12 digits.
              </p>
            </div>

            {/* Amount */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="amount"
                  className="text-ink-soft text-[11px] font-medium"
                >
                  Amount to Pay
                </label>

                <span className="text-ink-soft/60 text-[9px]">
                  {amount.length}/6
                </span>
              </div>

              <div className="relative">
                <span className="text-ink-soft pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[13px]">
                  ₱
                </span>

                <input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  className="bg-surface-raised text-ink placeholder:text-ink-soft/50 h-12 w-full rounded-xl border border-transparent pr-3.5 pl-8 text-[13px] transition-all outline-none focus:border-[#00b98b]/40 focus:ring-2 focus:ring-[#00b98b]/10"
                />
              </div>

              <p className="text-ink-soft/60 mt-1.5 text-[9px]">
                Maximum of 6 digits.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================== */}
        {/* PAYMENT SUMMARY */}
        {/* ===================================================== */}

        <section className="bg-surface-raised mt-6 rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-ink text-[12px] font-semibold">
              Payment Summary
            </h2>

            <span className="rounded-full bg-[#eafaf5] px-2 py-1 text-[9px] font-medium text-[#00a77d]">
              No Fee
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-ink-soft text-[11px]">Category</span>

            <span className="text-ink text-[11px] font-medium">
              {selectedCategory ?? "Not selected"}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-ink-soft text-[11px]">Biller</span>

            <span className="text-ink text-[11px] font-medium">
              {currentBiller?.name ?? "Not selected"}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-ink-soft text-[11px]">Service fee</span>

            <span className="text-[11px] font-medium text-[#00a77d]">
              ₱0.00
            </span>
          </div>

          <div className="my-3 border-t border-black/[0.05]" />

          <div className="flex items-center justify-between">
            <span className="text-ink text-[12px] font-semibold">Total</span>

            <span className="text-ink text-[16px] font-semibold">
              {formattedAmount}
            </span>
          </div>
        </section>

        {/* ===================================================== */}
        {/* PAY NOW BUTTON */}
        {/* ===================================================== */}

        <button
          type="button"
          disabled={!canPay}
          onClick={handlePayNow}
          className={`mt-5 h-12 w-full rounded-xl text-[13px] font-semibold transition-all ${
            canPay
              ? "bg-[#00b98b] text-white shadow-[0_8px_20px_-10px_rgba(0,185,139,0.8)] hover:bg-[#00a77d] active:scale-[0.99]"
              : "bg-surface-sunken text-ink-soft/50 cursor-not-allowed"
          }`}
        >
          {canPay ? "Pay Now" : "Enter Payment Details"}
        </button>

        <p className="text-ink-soft/60 mt-3 text-center text-[9.5px]">
          Please review your payment details before continuing.
        </p>
      </div>

      {/* ======================================================= */}
      {/* RECEIPT MODAL */}
      {/* ======================================================= */}

      {showReceipt && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:pb-0">
          <div className="w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
            {/* Receipt Header */}
            <div className="relative px-6 pt-7 pb-5 text-center">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                aria-label="Close receipt"
                className="absolute top-5 right-5 grid h-8 w-8 place-items-center rounded-full bg-[#f3f5f6] text-[#69727d] transition-colors hover:bg-[#e9ecef]"
              >
                <X size={16} strokeWidth={2} />
              </button>

              {/* Success icon */}
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

            {/* Receipt */}
            <div className="mx-5 rounded-2xl border border-[#edf0f2] bg-[#fafbfb] p-4">
              {/* Amount */}
              <div className="border-b border-dashed border-[#dfe4e7] pb-4 text-center">
                <p className="text-[10px] font-medium text-[#8a929c]">
                  Amount Paid
                </p>

                <p className="mt-1 text-[26px] font-semibold tracking-tight text-[#111827]">
                  {formattedAmount}
                </p>
              </div>

              {/* Receipt Details */}
              <div className="space-y-3 pt-4">
                <ReceiptRow label="Biller" value={currentBiller?.name ?? ""} />

                <ReceiptRow label="Category" value={selectedCategory ?? ""} />

                <ReceiptRow
                  label="Account Number"
                  value={maskedAccountNumber}
                />

                <ReceiptRow label="Service Fee" value="₱0.00" />

                <ReceiptRow label="Date & Time" value={transactionDate} />

                <ReceiptRow label="Reference Number" value={referenceNumber} />
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="px-5 pt-4 pb-5">
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

              {/* DONE -> DASHBOARD */}
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="h-12 w-full rounded-xl bg-[#00b98b] text-[13px] font-semibold text-white transition-colors hover:bg-[#00a77d] active:scale-[0.99]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ========================================================= */
/* RECEIPT ROW */
/* ========================================================= */

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[10.5px] text-[#8a929c]">{label}</span>

      <span className="max-w-[60%] text-right text-[10.5px] font-medium text-[#202832]">
        {value}
      </span>
    </div>
  );
}
