export default function Input({
  label,
  className = "",
  containerClass = "",
  labelClass = "",
  value,
  onChange,
  ...props
}: InputProps) {
  const isControlled = value !== undefined;

  return (
    <div className={`flex flex-col gap-1 ${containerClass}`}>
      {label && (
        <label className={`text-sm font-medium ${labelClass}`}>
          {label}
        </label>
      )}

      <input
        value={value}
        onChange={onChange}
        readOnly={isControlled && !onChange} // ✅ prevents warning
        className={`border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      />
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  containerClass?: string;
  labelClass?: string;
};