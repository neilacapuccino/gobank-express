type PaymentSummaryProps = {
  category: string | undefined;
  biller: string | undefined;
  total: string;
};

export function PaymentSummary({
  category,
  biller,
  total,
}: PaymentSummaryProps) {
  return (
    <section className="bg-surface-raised mt-6 rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[12px] font-semibold">Payment Summary</h2>
        <span className="bg-brand-soft text-brand-hover rounded-full px-2.5 py-1 text-[9px] font-medium">
          No Fee
        </span>
      </div>

      <SummaryRow label="Category" value={category ?? "Not selected"} />
      <SummaryRow label="Biller" value={biller ?? "Not selected"} />
      <SummaryRow label="Service fee" value="₱0.00" highlight />

      <div className="border-line my-3 border-t" />

      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold">Total</span>
        <span className="text-[17px] font-semibold tracking-tight">
          {total}
        </span>
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className="text-ink-soft text-[11px]">{label}</span>
      <span
        className={
          highlight
            ? "text-brand-hover text-[11px] font-medium"
            : "text-[11px] font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}
