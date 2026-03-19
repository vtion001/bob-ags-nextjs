import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = true, ...props }, ref) => {
    const baseStyles = 'bg-white border border-navy-200 rounded-lg p-6 shadow-sm transition-all duration-200'
    const hoverStyles = hoverable ? 'hover:border-navy-300 hover:shadow-md' : ''
    
    return (
      <div
        ref={ref}
        className={`${baseStyles} ${hoverStyles} ${className || ''}`}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

export default Card
