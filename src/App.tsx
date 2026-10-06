import { useEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type Memory = {
  id: number
  image: string
  label: string
  title: string
  description: string
  side: 'left' | 'right'
}

const memories: Memory[] = [
  { id: 1, image: '/images/photo-01.webp', label: '01', title: 'On this special day ❤️', description: '', side: 'left' },
  { id: 2, image: '/images/photo-02.webp', label: '02', title: 'You are the most important person in my life ❤️', description: '', side: 'right' },
  { id: 3, image: '/images/photo-03.webp', label: '03', title: 'You mean a lot to me ❤️', description: '', side: 'left' },
  { id: 4, image: '/images/photo-04.webp', label: '04', title: 'Both of you, just... 💕', description: '', side: 'right' },
  { id: 5, image: '/images/photo-05.webp', label: '05', title: 'No words to describe you guys 😍✨', description: '', side: 'left' },
  { id: 6, image: '/images/photo-06.webp', label: '06', title: 'My favourite people, always ❤️', description: '', side: 'right' },
  { id: 7, image: '/images/photo-07.webp', label: '07', title: 'You guys are truly special to me 🫶', description: '', side: 'left' },
  { id: 8, image: '/images/photo-08.webp', label: '08', title: 'Some bonds are just different 🥹❤️', description: '', side: 'right' },
  { id: 9, image: '/images/photo-09.webp', label: '09', title: 'You make every moment special ✨', description: '', side: 'left' },
  { id: 10, image: '/images/photo-10.webp', label: '10', title: 'So many memories, so much love ❤️', description: '', side: 'right' },
  { id: 11, image: '/images/photo-11.webp', label: '11', title: 'Lucky to have you both in my life 🫶', description: '', side: 'left' },
  { id: 12, image: '/images/photo-12.webp', label: '12', title: "More than family, you're my people ❤️", description: '', side: 'right' },
  { id: 13, image: '/images/photo-13.webp', label: '13', title: 'Edhukaagavum vittukuduka maaten 🥹', description: '', side: 'left' },
  { id: 14, image: '/images/photo-14.webp', label: '14', title: 'You guys make life more beautiful ✨', description: '', side: 'right' },
  { id: 15, image: '/images/photo-15.webp', label: '15', title: "No matter what, I'll always be there for you ❤️", description: '', side: 'left' },
  { id: 16, image: '/images/photo-16.webp', label: '16', title: 'Forever grateful for you both ❤️', description: '', side: 'right' },
  { id: 17, image: '/images/photo-17.webp', label: '17', title: "Here's to many more memories together 🥂❤️", description: '', side: 'left' },
  { id: 18, image: '/images/photo-18.webp', label: '18', title: "And finally… this one's for you, Maama ❤️", description: '', side: 'right' },
  { id: 19, image: '/images/photo-19.png', label: '19', title: '', description: '', side: 'left' },
]

// The photos are fixed planes in one 3D tunnel. Only the camera/scene moves.
const DEPTH_GAP = 1550
const TOTAL_TRAVEL = (memories.length - 1) * DEPTH_GAP

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function App() {
  const journeyRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const finalRevealRef = useRef<HTMLDivElement | null>(null)
  const photoRefs = useRef<Array<HTMLElement | null>>([])
  const copyRefs = useRef<Array<HTMLElement | null>>([])
  const frameRef = useRef<number | null>(null)
  const latestProgress = useRef(0)
  const lastAppliedProgress = useRef(-1)
  const [activeIndex, setActiveIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const journey = journeyRef.current
    const scene = sceneRef.current
    if (!journey || !scene) return

    const applyVisuals = (progress: number) => {
      // Ignore sub-pixel noise from wheel/touch events.
      if (Math.abs(progress - lastAppliedProgress.current) < 0.00025) return
      lastAppliedProgress.current = progress

      const current = progress * (memories.length - 1)
      const nearest = clamp(Math.round(current), 0, memories.length - 1)
      setActiveIndex((previous) => previous === nearest ? previous : nearest)

      // Only touch the few planes around the camera. The other planes stay hidden.
      const start = Math.max(0, Math.floor(current) - 2)
      const end = Math.min(memories.length - 1, Math.ceil(current) + 2)

      photoRefs.current.forEach((photo, index) => {
        if (!photo) return
        if (index < start || index > end) {
          if (photo.style.visibility !== 'hidden') photo.style.visibility = 'hidden'
          if (photo.style.opacity !== '0') photo.style.opacity = '0'
          return
        }

        const distance = Math.abs(current - index)
        const focus = clamp(1 - distance / 1.12, 0, 1)
        photo.style.visibility = 'visible'
        photo.style.opacity = String(0.28 + focus * 0.72)
        photo.style.setProperty('--focus-scale', String(0.985 + focus * 0.015))
      })

      // Only one or two copy blocks are active at a time.
      copyRefs.current.forEach((copy, index) => {
        if (!copy) return
        const distance = Math.abs(current - index)
        const reveal = clamp(1 - distance / 0.82, 0, 1)
        copy.style.visibility = reveal > 0.01 ? 'visible' : 'hidden'
        copy.style.opacity = String(reveal)
        copy.style.setProperty('--copy-offset-y', `${(1 - reveal) * 18}px`)
        copy.style.setProperty('--copy-scale', String(0.985 + reveal * 0.015))
      })

      // The final photo reaches the camera first. Only then does the message appear.
      const finalReveal = clamp((progress - 0.955) / 0.045, 0, 1)
      if (finalRevealRef.current) {
        finalRevealRef.current.style.visibility = finalReveal > 0.01 ? 'visible' : 'hidden'
        finalRevealRef.current.style.opacity = String(finalReveal)
        finalRevealRef.current.style.transform = `translate3d(-50%, ${22 - finalReveal * 22}px, 0) scale(${0.97 + finalReveal * 0.03})`
      }
    }

    const scheduleVisuals = (progress: number) => {
      latestProgress.current = progress
      if (frameRef.current !== null) return
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        const value = latestProgress.current
        const travel = value * TOTAL_TRAVEL
        scene.style.transform = `translate3d(0, 0, ${travel}px)`
        applyVisuals(value)
      })
    }

    if (reducedMotion) {
      scene.style.transform = 'translate3d(0,0,0)'
      photoRefs.current.forEach((photo, index) => {
        if (!photo) return
        photo.style.visibility = index === 0 ? 'visible' : 'hidden'
        photo.style.opacity = index === 0 ? '1' : '0'
      })
      copyRefs.current.forEach((copy, index) => {
        if (!copy) return
        copy.style.visibility = index === 0 ? 'visible' : 'hidden'
        copy.style.opacity = index === 0 ? '1' : '0'
      })
      return
    }

    const trigger = ScrollTrigger.create({
      trigger: journey,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.18,
      invalidateOnRefresh: true,
      fastScrollEnd: false,
      onUpdate: (self) => scheduleVisuals(self.progress),
    })

    gsap.set(scene, { transformStyle: 'preserve-3d', force3D: true })
    scheduleVisuals(0)
    ScrollTrigger.refresh()

    return () => {
      trigger.kill()
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [reducedMotion])

  return (
    <main className="app-shell">
      <div className="story-progress" aria-label={`Current memory ${activeIndex + 1} of ${memories.length}`}>
        <span>{String(activeIndex + 1).padStart(2, '0')}</span>
        <span className="progress-divider" />
        <span>{String(memories.length).padStart(2, '0')}</span>
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <span>Scroll to begin</span>
        <div className="scroll-indicator" />
      </div>

      <section className="journey" ref={journeyRef} style={{ '--journey-distance': `${TOTAL_TRAVEL}px` } as CSSProperties}>
        <div className="sticky-stage">
          <div className="scene" ref={sceneRef}>
            {memories.map((memory, index) => (
              <article
                key={memory.id}
                ref={(element) => { photoRefs.current[index] = element }}
                className={`memory-shell ${memory.side}`}
                style={{ transform: `translate3d(-50%, -50%, ${-index * DEPTH_GAP}px)` }}
              >
                <div className="memory-visual-clip">
                  <div className="memory-visual">
                    <img
                      src={memory.image}
                      alt={memory.title}
                      loading="eager"
                      decoding="async"
                      fetchPriority={index < 3 ? 'high' : 'auto'}
                      draggable={false}
                    />
                  </div>
                </div>

                {memory.title && (
                  <div ref={(element) => { copyRefs.current[index] = element }} className="memory-copy">
                    <span className="memory-label">{memory.label}</span>
                    <h2>{memory.title}</h2>
                    {memory.description && <p>{memory.description}</p>}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div ref={finalRevealRef} className="final-reveal" aria-live="polite">
            <p className="final-kicker">A little message for you</p>
            <h1>Happy Birthday Maama ❤️</h1>
            <h2>You mean a lot to me.</h2>
            <p>Thank you for all the memories, all the laughter, and all the moments.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
