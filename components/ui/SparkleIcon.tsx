'use client'

import React from 'react'

interface SparkleIconProps {
  size?: number
  className?: string
  accentColor?: string
}

export default function SparkleIcon({ size = 40, className = '' }: SparkleIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="APOLLO Logo"
      width={size}
      height={size}
      className={`object-contain inline-block flex-shrink-0 select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  )
}