import { useEffect, useState } from 'react'

// Free-text "prove your humanity" prompts. NOTHING is stored or transmitted —
// the value lives in local state and is discarded. This is the honeypot gag:
// a bot/scammer that autofills real data just gets mocked, never harvested.
export default function TextChallenge({ round, onChange }) {
  const [value, setValue] = useState('')

  useEffect(() => setValue(''), [round])
  useEffect(() => { onChange?.(value) }, [value, onChange])

  return (
    <div className="text-challenge">
      <input
        className="text-challenge__input"
        type="text"
        autoComplete="off"
        value={value}
        placeholder={round.input?.placeholder ?? 'Type your answer…'}
        onChange={(e) => setValue(e.target.value)}
      />
      <p className="text-challenge__note">
        🔒 Nothing you type here is saved or sent anywhere. It’s a joke. Please
        do not enter real card numbers, even ironically.
      </p>
    </div>
  )
}
