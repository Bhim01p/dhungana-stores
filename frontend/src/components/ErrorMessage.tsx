interface Props {
  message?: string;
}

export default function ErrorMessage({ message = 'Something went wrong.' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <span className="text-4xl">⚠️</span>
      <p className="text-gray-600 max-w-sm">{message}</p>
    </div>
  );
}
