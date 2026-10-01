import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <span className="text-6xl">🔍</span>
      <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
      <p className="text-gray-500 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Go back home
      </Link>
    </div>
  );
}
