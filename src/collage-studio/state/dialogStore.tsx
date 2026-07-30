import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// Native window.prompt/confirm/alert don't work in some embedded webviews
// (e.g. VS Code's Simple Browser) -- they just return null/false instantly
// with no visible dialog. This provides in-app replacements.

type PromptRequest = { kind: 'prompt'; message: string; resolve: (value: string | null) => void }
type ConfirmRequest = { kind: 'confirm'; message: string; resolve: (value: boolean) => void }
type DialogRequest = PromptRequest | ConfirmRequest

interface DialogApi {
  prompt: (message: string, defaultValue?: string) => Promise<string | null>
  confirm: (message: string) => Promise<boolean>
}

const DialogContext = createContext<DialogApi | null>(null)

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within DialogProvider')
  return ctx
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null)
  const [value, setValue] = useState('')

  const prompt = useCallback((message: string, defaultValue = '') => {
    return new Promise<string | null>((resolve) => {
      setValue(defaultValue)
      setRequest({ kind: 'prompt', message, resolve })
    })
  }, [])

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ kind: 'confirm', message, resolve })
    })
  }, [])

  const close = (result: string | null | boolean) => {
    if (!request) return
    if (request.kind === 'prompt') request.resolve(result as string | null)
    else request.resolve(result as boolean)
    setRequest(null)
  }

  return (
    <DialogContext.Provider value={{ prompt, confirm }}>
      {children}
      {request && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <p className="dialog-message">{request.message}</p>
            {request.kind === 'prompt' && (
              <input
                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') close(value)
                  if (e.key === 'Escape') close(null)
                }}
              />
            )}
            <div className="dialog-actions">
              <button onClick={() => close(request.kind === 'prompt' ? null : false)}>Cancel</button>
              <button className="active" onClick={() => close(request.kind === 'prompt' ? value : true)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}
