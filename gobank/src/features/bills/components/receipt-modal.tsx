import { Check, Receipt, X } from "lucide-react";

type ReceiptModalProps = {
  amount: string;
  biller: string;
  category: string;
  accountNumber: string;
  referenceNumber: string;
  transactionDate: string;
  points: number;
  balance: string;
  onClose: () => void;
  onDone: () => void;
};

export function ReceiptModal({
  amount,
  biller,
  category,
  accountNumber,
  referenceNumber,
  transactionDate,
  points,
  balance,
  onClose,
  onDone,
}: ReceiptModalProps) {
  const rows = [
    { label: "Biller", value: biller },
    { label: "Category", value: category },
    { label: "Account Number", value: accountNumber },
    { label: "Service Fee", value: "₱0.00" },
    { label: "Date & Time", value: transactionDate },
    { label: "Reference Number", value: referenceNumber },
    {
      label: "Points Earned",
      value: points > 0 ? `+${points.toLocaleString()} pts` : "None",
    },
    { label: "Balance After", value: balance },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:pb-0"
    >
      <div className="bg-surface w-full max-w-[420px] overflow-hidden rounded-[28px] shadow-2xl">
        <div className="relative px-6 pt-7 pb-5 text-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="bg-surface-sunken text-ink-soft hover:bg-surface-raised absolute top-5 right-5 grid h-8 w-8 place-items-center rounded-full transition-colors"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>

          <div className="bg-brand-soft mx-auto grid h-14 w-14 place-items-center rounded-full">
            <div className="bg-brand grid h-9 w-9 place-items-center rounded-full text-white">
              <Check size={20} strokeWidth={2.8} aria-hidden />
            </div>
          </div>

          <h2
            id="receipt-title"
            className="text-ink mt-4 text-[18px] font-semibold tracking-tight"
          >
            Payment Successful
          </h2>
          <p className="text-ink-muted mt-1 text-[11px]">
            Your bill payment has been processed.
          </p>
        </div>

        <div className="border-line bg-surface-sunken mx-5 rounded-2xl border p-4">
          <div className="border-line-strong border-b border-dashed pb-4 text-center">
            <p className="text-ink-muted text-[10px] font-medium">
              Amount Paid
            </p>
            <p className="text-ink mt-1 text-[27px] font-semibold tracking-tight">
              {amount}
            </p>
          </div>

          <dl className="space-y-3 pt-4">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4"
              >
                <dt className="text-ink-muted text-[10.5px]">{row.label}</dt>
                <dd className="text-ink max-w-[60%] text-right text-[10.5px] font-medium">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="px-5 pt-4 pb-5">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Receipt
              size={14}
              strokeWidth={1.8}
              className="text-brand"
              aria-hidden
            />
            <p className="text-ink-muted text-[10px]">
              Keep this receipt for your records.
            </p>
          </div>

          <button
            type="button"
            onClick={onDone}
            className="bg-brand hover:bg-brand-hover h-12 w-full rounded-xl text-[13px] font-semibold text-white transition-colors active:scale-[0.99]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
