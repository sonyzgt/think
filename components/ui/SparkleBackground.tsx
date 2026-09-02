'use client'

import { useEffect, useRef } from 'react'

interface Orb {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  baseAlpha: number
}

interface Particle {
  x: number
  y: number
  size: number
  vx: number
  vy: number
  alpha: number
}

export default function SparkleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef<{ x: number; y: number }>({ x: -2000, y: -2000 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Ambient floating light orbs (Apple visionOS / macOS dynamic wallpaper style)
    const orbs: Orb[] = [
      { x: width * 0.2, y: height * 0.3, radius: 350, vx: 0.3, vy: 0.2, baseAlpha: 0.08 },
      { x: width * 0.8, y: height * 0.6, radius: 450, vx: -0.25, vy: -0.15, baseAlpha: 0.06 },
      { x: width * 0.5, y: height * 0.8, radius: 300, vx: 0.15, vy: -0.2, baseAlpha: 0.05 },
    ]

    // Stardust particles
    const particles: Particle[] = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }))

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      // 1. Draw ambient gradient orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx
        orb.y += orb.vy

        if (orb.x - orb.radius < 0 || orb.x + orb.radius > width) orb.vx *= -1
        if (orb.y - orb.radius < 0 || orb.y + orb.radius > height) orb.vy *= -1

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)
        grad.addColorStop(0, `rgba(255, 255, 255, ${orb.baseAlpha})`)
        grad.addColorStop(0.5, `rgba(180, 180, 195, ${orb.baseAlpha * 0.5})`)
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // 2. Draw subtle mouse spotlight (Apple cursor ambient glow)
      if (mx > 0 && my > 0) {
        const mouseGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 320)
        mouseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)')
        mouseGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)')
        mouseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = mouseGrad
        ctx.beginPath()
        ctx.arc(mx, my, 320, 0, Math.PI * 2)
        ctx.fill()
      }

      // 3. Draw gentle stardust particles
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#000000]">
      {/* Deep Apple OLED Black Backdrop */}
      <div className="absolute inset-0 bg-[#000000]" />

      {/* Dynamic Ambient Vision Glass Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  )
}
