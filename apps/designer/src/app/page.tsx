'use client'

import { useCallback, useState } from 'react'
import { open } from '@tauri-apps/api/dialog'

export default function Landing() {
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null)

  const handleOpenDirectory = useCallback(() => {
    ;(async () => {
      const selectedDirectory = (await open({
        directory: true,
        multiple: false,
      })) as string | null
      setCurrentDirectory(selectedDirectory)
    })()
  }, [])

  return (
    <main>
      <button type="button" onClick={handleOpenDirectory}>
        Open
      </button>
      {currentDirectory}
    </main>
  )
}
