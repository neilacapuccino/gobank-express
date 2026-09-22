import { useId, type ChangeEvent } from "react";
import { cn } from "~/shared/lib/cn";

type PaymentFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  hint: string;
  prefix?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function PaymentField({
  label,
  value,
  placeholder,
  maxLength,
  hint,
  prefix,
  onChange,
}: PaymentFieldProps) {
  const id = useId();

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-ink-soft text-[11px] font-medium">
          {label}
        </label>
        <span className="text-ink-soft/60 text-[9px]">
          {value.length}/{maxLength}
        </span>
      </div>

      <div className="relative">
        {prefix ? (
          <span className="text-ink-soft pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[13px]">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "bg-surface-raised text-ink placeholder:text-ink-soft/50 focus:border-brand focus:ring-brand/15 h-12 w-full rounded-xl border border-transparent px-3.5 text-[13px] transition-all outline-none focus:ring-2",
            prefix ? "pl-8" : null,
          )}
        />
      </div>

      <p className="text-ink-soft/60 mt-1.5 text-[9px]">{hint}</p>
    </div>
  );
}
