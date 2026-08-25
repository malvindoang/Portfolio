import { useEffect, useState } from 'react'

function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const format = () => {
      const now = new Date()
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)
      setTime(`${formatted} WIB`)
    }
    format()
    const interval = setInterval(format, 1000)
    return () => clearInterval(interval)
  }, [])

  return <span>{time}</span>
}

export default LiveClock