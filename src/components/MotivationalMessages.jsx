import { useEffect, useState } from 'react'

const MESSAGES = [
  'You are stronger than your urges',
  'This feeling will pass',
  'Breathe. You are safe',
  'Your future self is proud of you',
  'Every second you wait is a victory',
  'Small steps lead to big change',
  'Progress over perfection',
  'You deserve peace and freedom',
  'Choose courage, not comfort',
  'You can do hard things',
  'Recovery is a journey, not a race',
  'Cravings are temporary, your strength is lasting',
  'Be kind to yourself today',
  'You are not alone',
  'Your choices shape your tomorrow',
  'One minute at a time',
  'The urge will fade',
  'You are building resilience',
  'This is a win right now',
  'Keep breathing and stay with yourself',
]

export default function MotivationalMessages() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * MESSAGES.length))
  const [show, setShow] = useState(true)

  useEffect(() => {
    setShow(true)
  }, [])

  const next = () => {
    setShow(false)
    setTimeout(() => {
      setIndex(Math.floor(Math.random() * MESSAGES.length))
      setShow(true)
    }, 250)
  }

  return (
    <div className="rounded-xl bg-blue-50 border border-blue-100 p-6">
      <div className="overflow-hidden h-20 md:h-24">
        <div
          className={`text-2xl md:text-3xl font-semibold text-gray-900 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        >
          {MESSAGES[index]}
        </div>
      </div>
      <button
        onClick={next}
        className="mt-4 rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
      >
        Next
      </button>
    </div>
  )
}
