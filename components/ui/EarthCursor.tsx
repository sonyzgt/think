'use client'

import React, { useEffect, useState } from 'react'

export default function EarthCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(false)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Only enable on desktop pointer devices
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return
    setIsDesktop(true)

    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)

      // Detect if hovering interactive targets
      const target = e.target as HTMLElement | SVGElement | null
      if (target) {
        const isClickable =
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'path' ||
          target.getAttribute('role') === 'button' ||
          target.closest('button') !== null ||
          target.closest('a') !== null ||
          target.classList.contains('cursor-pointer') ||
          window.getComputedStyle(target).cursor === 'pointer'

        setIsHovered(!!isClickable)
      }
    }

    const onMouseDown = () => setIsMouseDown(true)
    const onMouseUp = () => setIsMouseDown(false)
    const onMouseLeave = () => setIsVisible(false)
    const onMouseEnter = () => setIsVisible(true)

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
    }
  }, [isVisible])

  if (!isDesktop || !isVisible) return null

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-[99999] transition-transform duration-75 ease-out will-change-transform select-none"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      }}
    >
      {/* 3D Glowing Earth Sphere Cursor */}
      <div
        className="relative -top-3 -left-3 flex items-center justify-center transition-all duration-150 ease-out"
        style={{
          transform: `scale(${isMouseDown ? 0.85 : isHovered ? 1.35 : 1})`,
        }}
      >
        {/* Atmosphere Halo Glow */}
        <div
          className={`absolute rounded-full transition-all duration-300 ${
            isHovered
              ? 'w-10 h-10 bg-cyan-400/40 blur-md animate-pulse'
              : 'w-7 h-7 bg-sky-500/25 blur-sm'
          }`}
        />

        {/* Outer Orbital Ring on Hover */}
        {isHovered && (
          <div className="absolute w-9 h-9 rounded-full border border-cyan-300/60 animate-spin opacity-80" style={{ animationDuration: '4s' }}>
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
          </div>
        )}

        {/* 3D Earth Globe SVG */}
        <svg
          width="26"
          height="26"
          viewBox="0 0 32 32"
          className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] filter"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Deep Ocean Radial Gradient */}
            <radialGradient id="earthOcean" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="35%" stopColor="#0284C7" />
              <stop offset="75%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#082F49" />
            </radialGradient>

            {/* Atmosphere Specular Reflection */}
            <linearGradient id="earthGloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Drop Shadow */}
            <filter id="earthShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0284c7" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Earth Ocean Body */}
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="url(#earthOcean)"
            stroke="#ffffff"
            strokeWidth="0.85"
            filter="url(#earthShadow)"
          />

          {/* Continents & Landmasses */}
          <g fill="#4ADE80" opacity="0.95">
            {/* North / South America representation */}
            <path d="M10 9c1.5-.8 3.5-.2 3.5 1.5 0 1.2-1 2.2-2 2.5-1.5.5-2.2-.5-2.5-1.5-.2-.8.2-2 1-2.5z" />
            <path d="M11 16c1-.5 2.2 0 2.5 1.2.3 1.5-.5 3-1.8 3.5-1 .4-1.8-.5-1.7-1.7.1-1.2.2-2.5 1-3z" />
            {/* Eurasia / Africa / Asia representation */}
            <path d="M18 8c2.2-.2 4 1 4.5 2.5.3 1.2-.5 2.5-1.5 3-1.2.6-2.8-.2-3.5-1.2-.6-1-.2-3.8.5-4.3z" />
            <path d="M17 15c1.8 0 3 1.5 3 3 0 1.5-1.5 2.8-2.8 2.8-1.2 0-2.2-1.2-2-2.8.2-1.5 1-3 1.8-3z" />
            <path d="M22 17c1-.2 1.8.8 1.6 1.8-.2.8-1 1.2-1.8 1-.8-.2-1.2-1-1-1.8.2-.8.6-1 1.2-1z" />
          </g>

          {/* Latitude / Longitude Vector Coordinate Grid */}
          <ellipse
            cx="16"
            cy="16"
            rx="12"
            ry="4.5"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.4"
          />
          <ellipse
            cx="16"
            cy="16"
            rx="4.5"
            ry="12"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.4"
          />

          {/* Atmosphere Glass Specular Highlight */}
          <ellipse
            cx="14"
            cy="12"
            rx="7"
            ry="3.5"
            fill="url(#earthGloss)"
            transform="rotate(-25 14 12)"
          />

          {/* Center Precision Aiming Reticle Dot */}
          <circle
            cx="16"
            cy="16"
            r="1.75"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="0.75"
          />
        </svg>
      </div>
    </div>
  )
}
