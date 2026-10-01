const STATUS_STEPS = [
  { key: "PENDING",          label: "Order Received",   icon: "📋" },
  { key: "CONFIRMED",        label: "Confirmed",        icon: "✅" },
  { key: "PREPARING",        label: "Being Prepared",   icon: "🍳" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🚚" },
  { key: "DELIVERED",        label: "Delivered",        icon: "🎉" },
];

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING:          "bg-yellow-100 text-yellow-800",
    CONFIRMED:        "bg-blue-100 text-blue-800",
    PREPARING:        "bg-orange-100 text-orange-800",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED:        "bg-green-100 text-green-800",
    CANCELLED:        "bg-red-100 text-red-800",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function OrderStatusTracker({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return <p className="text-sm text-red-600 font-semibold mt-2">❌ This order was cancelled.</p>;
  }
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-start gap-1 flex-wrap mt-3">
      {STATUS_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base
                ${current ? "bg-brand-500 text-white shadow-md ring-2 ring-brand-300" :
                  done    ? "bg-brand-200 text-brand-700" : "bg-gray-100 text-gray-400"}`}>
                {step.icon}
              </div>
              <p className={`text-[10px] font-semibold mt-1 text-center leading-tight w-14
                ${current ? "text-brand-600" : done ? "text-brand-400" : "text-gray-400"}`}>
                {step.label}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 w-5 mb-4 rounded ${done ? "bg-brand-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
