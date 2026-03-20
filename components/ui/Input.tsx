import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-navy-700 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg text-navy-900 placeholder-navy-400 transition-all duration-200 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
          } ${className || ''}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 mt-1.5">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-navy-500 mt-1.5">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export default Input
