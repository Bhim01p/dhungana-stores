import { useEffect, useState } from "react";

interface Props {
  url?: string | null;
  name: string;
  amount?: number;
  accountInfo?: string | null;
  className?: string;
}

export default function PaymentQrImage({ url, name, amount, accountInfo, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <p className="text-sm font-bold text-gray-800">{name}</p>
      {amount !== undefined && <p className="text-sm text-gray-600">Amount: <strong>NPR {amount.toLocaleString("en-NP")}</strong></p>}
      {!url || failed ? (
        <p role="alert" className="max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          {url ? "This payment QR could not load. Contact the store before sending money." : "Payment details are unavailable. Contact the store before sending money."}
        </p>
      ) : (
        <img
          src={url}
          alt={`${name} payment QR code`}
          className="h-44 w-44 rounded-lg border border-gray-200 bg-white p-2 object-contain"
          onError={() => setFailed(true)}
        />
      )}
      {accountInfo && <p className="text-center text-sm text-gray-600">Account: <strong className="text-gray-900">{accountInfo}</strong></p>}
    </div>
  );
}
