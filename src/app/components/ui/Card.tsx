// src/components/ui/Card.tsx
export default function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white shadow-md border border-gray-200 rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow duration-200">
      {title && (
        <h2 className="text-lg font-bold text-gray-800 pb-2 border-b border-gray-200">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}