export function LoadingView({ label = "불러오는 중이에요" }: { label?: string }) {
  return <div className="rounded-md bg-white p-5 text-center text-sm text-neutral-500 shadow-soft">{label}</div>;
}

export function EmptyView({ label }: { label: string }) {
  return <div className="rounded-md border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">{label}</div>;
}

export function ErrorView({ label }: { label: string }) {
  return <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{label}</div>;
}
