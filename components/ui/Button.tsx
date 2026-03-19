import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md',
    isLoading = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'font-medium transition-all duration-200 rounded-xs font-sans cursor-pointer inline-flex items-center justify-center gap-2'
    
    const variantStyles = {
      primary: 'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-700',
      secondary: 'border border-navy-300 text-navy-900 hover:bg-navy-50 active:bg-navy-100',
      ghost: 'text-navy-600 hover:text-navy-900 active:text-navy-950',
    }
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }
    
    const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''
    
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className || ''}`}
        {...props}
      >
        {isLoading && (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
