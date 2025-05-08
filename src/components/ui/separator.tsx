'use client'

import * as React from 'react'

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}

export function Separator({ className = '', ...props }: SeparatorProps) {
  return (
    <hr className={`my-2 border-t border-border/50 ${className}`} {...props} />
  )
}
