"use client";

import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { dateTime, digitsOnly, maskDigits, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { cn } from "~/shared/lib/cn";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { CATEGORIES, findCategory, type Category } from "../bill-categories";
import { BillerCard } from "./biller-card";
import { CategoryCard } from "./category-card";
import { PaymentField } from "./payment-field";
import { PaymentSummary } from "./payment-summary";
import { ReceiptModal } from "./receipt-modal";

const ACCOUNT_DIGITS = 12;
const AMOUNT_DIGITS = 6;

export function BillPayment() {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<Category | null>(null);
  const [billerId, setBillerId] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");

  const catalogue = api.bills.billers.useQuery();
  const pay = api.bills.pay.useMutation();

  const category = findCategory(categoryId);
  const billers =
    catalogue.data?.filter((biller) => biller.category === categoryId) ?? [];
  const biller = billers.find((item) => item.id === billerId);
  const centavos = toCentavos(Number(amount));

  const canPay =
    Boolean(biller) &&
    accountNumber.length >= 4 &&
    centavos > 0 &&
    !pay.isPending;

  const chooseCategory = (id: Category) => {
    setCategoryId(id);
    setBillerId(null);
  };

  const payNow = () => {
    if (!canPay || !biller) return;
    pay.mutate({ billerId: biller.id, accountNumber, amount: centavos });
  };

  const done = () => {
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex flex-1 flex-col pb-10">
      <header className="relative flex h-16 items-center justify-center">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="bg-surface-sunken text-ink-soft hover:bg-surface-raised absolute left-0 grid h-10 w-10 place-items-center rounded-full transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={1.9} aria-hidden />
        </Link>
        <div className="text-center">
          <h1 className="text-[16px] font-semibold tracking-tight">
            Pay Bills
          </h1>
          <p className="text-ink-soft mt-0.5 text-[11px]">
            Pay your bills easily
          </p>
        </div>
      </header>

      <section className="mt-4">
        <SectionTitle>What do you want to pay?</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((item) => (
            <CategoryCard
              key={item.id}
              label={item.label}
              icon={item.icon}
              selected={categoryId === item.id}
              onClick={() => chooseCategory(item.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle>Select Biller</SectionTitle>
        {!categoryId ? (
          <EmptyState>Select a bill category first</EmptyState>
        ) : catalogue.isPending ? (
          <EmptyState>Loading billers</EmptyState>
        ) : billers.length === 0 ? (
          <EmptyState>No billers in this category yet</EmptyState>
        ) : (
          <div className="space-y-2">
            {billers.map((item) => (
              <BillerCard
                key={item.id}
                biller={item}
                icon={category?.icon ?? Zap}
                selected={billerId === item.id}
                onClick={() => setBillerId(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <SectionTitle>Payment Details</SectionTitle>
        <div className="space-y-4">
          <PaymentField
            label="Account Number"
            value={accountNumber}
            placeholder="Enter your account number"
            maxLength={ACCOUNT_DIGITS}
            hint={`4 to ${ACCOUNT_DIGITS} digits.`}
            onChange={(event) =>
              setAccountNumber(digitsOnly(event.target.value, ACCOUNT_DIGITS))
            }
          />
          <PaymentField
            label="Amount to Pay"
            value={amount}
            placeholder="Enter amount"
            maxLength={AMOUNT_DIGITS}
            hint={`Maximum of ${AMOUNT_DIGITS} digits.`}
            prefix="₱"
            onChange={(event) =>
              setAmount(digitsOnly(event.target.value, AMOUNT_DIGITS))
            }
          />
        </div>
      </section>

      <PaymentSummary
        category={category?.label}
        biller={biller?.name}
        total={peso(centavos)}
      />

      {pay.error ? (
        <p
          role="alert"
          className="bg-danger-soft text-danger mt-5 rounded-xl px-4 py-3 text-[12px]"
        >
          {errorMessage(pay.error)}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!canPay}
        onClick={payNow}
        className={cn(
          "mt-5 h-12 w-full rounded-xl text-[13px] font-semibold transition-all",
          canPay
            ? "bg-brand hover:bg-brand-hover text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.8)] active:scale-[0.99]"
            : "bg-surface-sunken text-ink-soft/50 cursor-not-allowed",
        )}
      >
        {pay.isPending
          ? "Processing payment"
          : canPay
            ? "Pay Now"
            : "Enter Payment Details"}
      </button>

      <p className="text-ink-soft/60 mt-3 text-center text-[9.5px]">
        Please review your payment details before continuing.
      </p>

      {pay.data ? (
        <ReceiptModal
          amount={peso(Math.abs(pay.data.amount))}
          biller={biller?.name ?? ""}
          category={category?.label ?? ""}
          accountNumber={maskDigits(accountNumber)}
          referenceNumber={pay.data.reference}
          transactionDate={dateTime(pay.data.createdAt)}
          points={pay.data.points}
          balance={peso(pay.data.balanceAfter)}
          onClose={() => pay.reset()}
          onDone={done}
        />
      ) : null}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-[13px] font-semibold">{children}</h2>;
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface-raised flex min-h-[74px] items-center justify-center rounded-2xl px-4">
      <p className="text-ink-soft text-center text-[11px]">{children}</p>
    </div>
  );
}
