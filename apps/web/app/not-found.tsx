import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F5]">
      <div className="text-center px-6">
        <h1 className="text-8xl font-bold text-rose-300 font-serif">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mt-4 mb-2">
          Página não encontrada
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-rose-400 text-white px-6 py-3 rounded-xl font-medium hover:bg-rose-500 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
