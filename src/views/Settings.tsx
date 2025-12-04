import './Settings.css'

import { useEffect, useState } from 'react'
import { store } from '@telemetryos/sdk'

export function Settings() {
  const [subtitleText, setSubtitleText] = useState('')
  const [isLoadingValue, setIsLoadingValue] = useState(true)

  useEffect(() => {
    store()
      .instance.get<string>('subtitle')
      .then((subtitle) => {
        if (subtitle !== undefined) {
          setSubtitleText(subtitle)
        } else {
          const defaultSubtitle = 'Change this line in settings ⚙️ ↗️'
          store().instance.set('subtitle', defaultSubtitle).catch(console.error)
          setSubtitleText(defaultSubtitle)
        }
        setIsLoadingValue(false)
      })
      .catch(console.error)
  }, [])

  const handleSubtitleChange = (subtitle: string) => {
    setSubtitleText(subtitle)
    store().instance.set('subtitle', subtitle).catch(console.error)
  }

  return (
    <div className="settings">
      <div className="settings__field">
        <div className="settings__label">Subtitle Text</div>
        <input
          className="settings__input"
          type="text"
          value={subtitleText}
          onChange={(e) => handleSubtitleChange(e.target.value)}
          disabled={isLoadingValue}
        />
      </div>
    </div>
  )
}
