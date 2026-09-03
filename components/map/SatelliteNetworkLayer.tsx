'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MAP_COUNTRY_PATHS } from '@/lib/map-paths'
import { SwapEventPayload } from '@/lib/swap-events'

export { triggerMapSwapBeam } from '@/lib/swap-events-trigger'

interface CyberNode {
  code: string
  name: string
  x: number
  y: number
}

interface SwapBeam {
  id: string
  from: CyberNode
  to: CyberNode
  progress: number // 0 to 1
  speed: number
  color: string
  secondaryColor: string
  arcHeight: number
  label: string
  amount: string
  tailPoints: { x: number; y: number }[]
  isUserAction?: boolean
}

interface Impact {
  id: string
  x: number
  y: number
  color: string
  radius: number
  maxRadius: number
  opacity: number
  label?: string
}

const SWAP_COLORS = [
  { primary: '#FF6A00', secondary: '#FFA04D' }, // Electric Orange
  { primary: '#38BDF8', secondary: '#7DD3FC' }, // Neon Cyan
  { primary: '#10B981', secondary: '#6EE7B7' }, // Emerald Glow
  { primary: '#FF334B', secondary: '#FF7588' }, // Cyber Red
  { primary: '#A855F7', secondary: '#C084FC' }, // Ultraviolet
]

// Quadratic Bezier Calculation: B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
function getBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
) {
  const invT = 1 - t
  const x = invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x
  const y = invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y
  return { x, y }
}

export default function SatelliteNetworkLayer() {
  const [beams, setBeams] = useState<SwapBeam[]>([])
  const [impacts, setImpacts] = useState<Impact[]>([])
  const beamIdCounter = useRef(0)
  const animFrameRef = useRef<number | null>(null)

  // Map of all country coordinates from map-paths
  const countryMap = useRef<Map<string, CyberNode>>(new Map())

  useEffect(() => {
    const map = new Map<string, CyberNode>()
    for (const item of MAP_COUNTRY_PATHS) {
      if (item.center && item.center.x && item.center.y) {
        map.set(item.code.toUpperCase(), {
          code: item.code.toUpperCase(),
          name: item.name,
          x: item.center.x,
          y: item.center.y,
        })
      }
    }
    countryMap.current = map
  }, [])

  // Synchronous listener: ONLY fires when a swap/buy transaction is received!
  useEffect(() => {
    const handleSwapEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SwapEventPayload>
      const detail = customEvent.detail
      if (!detail || !detail.toCountry) return

      const toCode = detail.toCountry.toUpperCase()
      const toNode = countryMap.current.get(toCode) || {
        code: toCode,
        name: toCode,
        x: 680,
        y: 130,
      }

      let fromCode = detail.fromCountry?.toUpperCase()
      if (!fromCode || fromCode === toCode) {
        const popularOrigins = ['BR', 'US', 'ID', 'DE', 'GB', 'JP', 'SG', 'AU', 'CA', 'CN'].filter(
          (c) => c !== toCode
        )
        fromCode = popularOrigins[Math.floor(Math.random() * popularOrigins.length)]
      }

      const fromNode = countryMap.current.get(fromCode) || {
        code: fromCode,
        name: fromCode,
        x: 340,
        y: 350,
      }

      const typeLabel = detail.type || 'SWAP'
      const amountLabel = detail.amount ? `${detail.amount}` : '0.05 ETH'
      const text = `${typeLabel}: ${amountLabel} (${fromCode} ➔ ${toCode})`

      const colorScheme =
        typeLabel === 'BUY'
          ? { primary: '#FF6A00', secondary: '#FFA04D' }
          : typeLabel === 'SELL'
          ? { primary: '#FF334B', secondary: '#FF7588' }
          : SWAP_COLORS[Math.floor(Math.random() * SWAP_COLORS.length)]

      const dist = Math.hypot(fromNode.x - toNode.x, fromNode.y - toNode.y)
      const arcHeight = Math.min(160, Math.max(45, dist * 0.32))

      const newBeam: SwapBeam = {
        id: `beam-${++beamIdCounter.current}`,
        from: fromNode,
        to: toNode,
        progress: 0,
        speed: 0.0065, // ~2.5s duration
        color: colorScheme.primary,
        secondaryColor: colorScheme.secondary,
        arcHeight,
        label: text,
        amount: amountLabel,
        tailPoints: [],
        isUserAction: true,
      }

      setBeams((prev) => [...prev.slice(-15), newBeam])
    }

    window.addEventListener('apollo_token_swap', handleSwapEvent)
    return () => {
      window.removeEventListener('apollo_token_swap', handleSwapEvent)
    }
  }, [])

  // Animation Frame Loop (Only processes active beams in flight)
  useEffect(() => {
    const runLoop = () => {
      // 1. Advance Beams along Quadratic Bezier Arcs
      setBeams((prevBeams) => {
        if (prevBeams.length === 0) return prevBeams

        const nextBeams: SwapBeam[] = []
        const newImpacts: Impact[] = []

        for (const beam of prevBeams) {
          const nextProg = beam.progress + beam.speed

          if (nextProg >= 1) {
            // Reached Target Country -> Trigger Expanding Shockwave Impact
            newImpacts.push({
              id: `imp-${beam.id}-${Date.now()}`,
              x: beam.to.x,
              y: beam.to.y,
              color: beam.color,
              radius: 2,
              maxRadius: 36,
              opacity: 1,
              label: beam.label,
            })
          } else {
            // Mid-flight: calculate current ballistic point
            const midX = (beam.from.x + beam.to.x) / 2
            const midY = (beam.from.y + beam.to.y) / 2 - beam.arcHeight
            const p0 = { x: beam.from.x, y: beam.from.y }
            const p1 = { x: midX, y: midY }
            const p2 = { x: beam.to.x, y: beam.to.y }

            const currentPos = getBezierPoint(p0, p1, p2, nextProg)
            const updatedTail = [...beam.tailPoints, currentPos].slice(-9)

            nextBeams.push({
              ...beam,
              progress: nextProg,
              tailPoints: updatedTail,
            })
          }
        }

        if (newImpacts.length > 0) {
          setImpacts((prev) => [...prev, ...newImpacts].slice(-25))
        }

        return nextBeams
      })

      // 2. Expand and Fade Impact Shockwaves
      setImpacts((prevImpacts) => {
        if (prevImpacts.length === 0) return prevImpacts
        return prevImpacts
          .map((imp) => ({
            ...imp,
            radius: imp.radius + 1.2,
            opacity: imp.opacity - 0.035,
          }))
          .filter((imp) => imp.opacity > 0)
      })

      animFrameRef.current = requestAnimationFrame(runLoop)
    }

    animFrameRef.current = requestAnimationFrame(runLoop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  if (beams.length === 0 && impacts.length === 0) {
    return null
  }

  return (
    <g className="pointer-events-none select-none">
      <defs>
        {/* Glow Filters for Laser Beams and Shockwaves */}
        <filter id="swap-laser-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#FF6A00" floodOpacity="0.9" />
        </filter>
        <filter id="swap-impact-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#FF6A00" floodOpacity="0.95" />
        </filter>
      </defs>

      {/* 1. Ballistic Laser Arcs & Traveling Photons */}
      {beams.map((beam) => {
        const midX = (beam.from.x + beam.to.x) / 2
        const midY = (beam.from.y + beam.to.y) / 2 - beam.arcHeight
        const pathD = `M ${beam.from.x} ${beam.from.y} Q ${midX} ${midY} ${beam.to.x} ${beam.to.y}`

        const p0 = { x: beam.from.x, y: beam.from.y }
        const p1 = { x: midX, y: midY }
        const p2 = { x: beam.to.x, y: beam.to.y }
        const head = getBezierPoint(p0, p1, p2, beam.progress)

        return (
          <g key={beam.id}>
            {/* Background Parabolic Guideline Path */}
            <path
              d={pathD}
              fill="none"
              stroke={beam.color}
              strokeWidth="1.5"
              strokeOpacity="0.45"
              strokeDasharray="4,2"
            />

            {/* Glowing Laser Comet Trail */}
            {beam.tailPoints.map((pt, idx) => {
              const tailOpacity = ((idx + 1) / beam.tailPoints.length) * 0.95
              const tailSize = 0.8 + ((idx + 1) / beam.tailPoints.length) * 2.6
              return (
                <circle
                  key={`tail-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={tailSize}
                  fill={beam.secondaryColor}
                  opacity={tailOpacity}
                />
              )
            })}

            {/* Glowing Laser Projectile Head */}
            <circle
              cx={head.x}
              cy={head.y}
              r="3.6"
              fill="#FFFFFF"
              stroke={beam.color}
              strokeWidth="1.2"
              filter="url(#swap-laser-glow)"
            />

            {/* Floating Transaction HUD Tag above Head */}
            <g transform={`translate(${head.x}, ${head.y - 12})`}>
              <rect
                x="-40"
                y="-7"
                width="80"
                height="12"
                rx="3"
                fill="#080A0D"
                stroke={beam.color}
                strokeWidth="0.75"
                opacity="0.95"
              />
              <text
                x="0"
                y="1.5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="5"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.3"
              >
                {beam.label}
              </text>
            </g>

            {/* Firing Origin Blast Ring */}
            {beam.progress < 0.18 && (
              <circle
                cx={beam.from.x}
                cy={beam.from.y}
                r={beam.progress * 60}
                fill="none"
                stroke={beam.color}
                strokeWidth="1.2"
                opacity={1 - beam.progress / 0.18}
              />
            )}
          </g>
        )
      })}

      {/* 2. Target Country Impact Shockwaves */}
      {impacts.map((imp) => (
        <g key={imp.id} transform={`translate(${imp.x}, ${imp.y})`}>
          {/* Outer Expanding Shockwave Ripple */}
          <circle
            r={imp.radius}
            fill="none"
            stroke={imp.color}
            strokeWidth={Math.max(0.6, 2.5 * imp.opacity)}
            opacity={imp.opacity}
            filter="url(#swap-impact-glow)"
          />

          {/* Inner Secondary Shockwave Ripple */}
          {imp.radius > 5 && (
            <circle
              r={imp.radius * 0.55}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.8"
              opacity={imp.opacity * 0.9}
            />
          )}

          {/* Impact Core Flash */}
          {imp.radius < 9 && (
            <circle
              r={Math.max(1, 4.5 * imp.opacity)}
              fill="#FFFFFF"
              opacity={imp.opacity}
            />
          )}
        </g>
      ))}
    </g>
  )
}
