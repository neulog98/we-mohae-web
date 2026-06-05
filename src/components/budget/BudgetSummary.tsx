import { formatCurrency } from "@/lib/date/format";

interface BudgetSummaryProps {
  summary: {
    estimatedAmount: number;
    contractAmount: number;
    paidAmount: number;
    remainingAmount: number;
    groomPaidAmount?: number;
    bridePaidAmount?: number;
    sharedPaidAmount?: number;
  };
  compact?: boolean;
}

export function BudgetSummary({ summary, compact = false }: BudgetSummaryProps) {
  const rows = [
    ["총 예상 예산", summary.estimatedAmount],
    ["총 계약금", summary.contractAmount],
    ["총 결제금액", summary.paidAmount],
    ["남은 결제금액", summary.remainingAmount]
  ];
  const payerRows = [
    ["신랑 결제 합계", summary.groomPaidAmount ?? 0],
    ["신부 결제 합계", summary.bridePaidAmount ?? 0],
    ["공동 결제 합계", summary.sharedPaidAmount ?? 0]
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {[...rows, ...(compact ? [] : payerRows)].map(([label, amount]) => (
        <div key={label} className="rounded-md bg-white p-4 shadow-soft">
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="mt-2 text-base font-bold text-ink">{formatCurrency(Number(amount))}</p>
        </div>
      ))}
    </div>
  );
}
