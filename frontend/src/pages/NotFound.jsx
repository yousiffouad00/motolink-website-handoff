import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-24 text-center">
      <h1 className="font-display font-bold text-6xl text-motolink-blue-dark mb-4">
        404
      </h1>
      <p className="text-motolink-slate text-lg mb-8">
        Page not found.
      </p>
      <Link
        to="/"
        className="inline-block px-5 py-2.5 bg-motolink-blue text-white font-display font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to home
      </Link>
    </main>
  );
}