'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { CHAT_EXAMPLE_PROMPTS, ChatMessage, PendingAction } from '@/lib/chat'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [lastFailedContent, setLastFailedContent] = useState<string | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || hasLoadedHistory) return
    setIsLoadingHistory(true)
    fetch('/api/chat/messages')
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages ?? [])
        setPendingAction(data.pendingAction ?? null)
        setHasLoadedHistory(true)
      })
      .catch(() => setSendError('Verlauf konnte nicht geladen werden.'))
      .finally(() => setIsLoadingHistory(false))
  }, [open, hasLoadedHistory])

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pendingAction, isSending])

  async function sendMessage(content: string) {
    const trimmed = content.trim()
    if (!trimmed || isSending) return

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMessage])
    setInput('')
    setSendError(null)
    setIsSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })
      if (!res.ok) throw new Error('request failed')
      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setPendingAction(data.pendingAction ?? null)
      setLastFailedContent(null)
    } catch {
      setSendError('Antwort konnte nicht geladen werden.')
      setLastFailedContent(trimmed)
    } finally {
      setIsSending(false)
    }
  }

  async function respondToPendingAction(decision: 'confirm' | 'decline') {
    if (!pendingAction) return
    setIsConfirming(true)
    setSendError(null)
    try {
      const res = await fetch('/api/chat/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingActionId: pendingAction.id, decision }),
      })
      if (!res.ok) throw new Error('request failed')
      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setPendingAction(null)
    } catch {
      setSendError(
        decision === 'confirm'
          ? 'Aktion konnte nicht bestätigt werden.'
          : 'Ablehnung konnte nicht übermittelt werden.'
      )
    } finally {
      setIsConfirming(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendMessage(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  const isEmpty = hasLoadedHistory && messages.length === 0 && !pendingAction

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        aria-label="Chat öffnen"
        className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg"
      >
        <MessageCircle className="size-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Assistent</SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4">
            {isLoadingHistory ? (
              <p className="text-sm text-muted-foreground">Lädt...</p>
            ) : isEmpty ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Frag mich was zu deinen Kontakten, oder bitte mich, etwas für dich zu erledigen.
                </p>
                <div className="flex flex-col gap-2">
                  {CHAT_EXAMPLE_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      className="h-auto justify-start text-left text-sm"
                      onClick={() => setInput(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    data-testid="chat-message"
                    className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={cn(
                          'mt-1 text-[10px] opacity-70',
                          message.role === 'user' ? 'text-right' : 'text-left'
                        )}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}

                {pendingAction && pendingAction.status === 'pending' && (
                  <div
                    data-testid="pending-action-card"
                    className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950"
                  >
                    <p className="font-medium">Bestätigung nötig</p>
                    <p className="mt-1 text-muted-foreground">{pendingAction.summary}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        disabled={isConfirming}
                        onClick={() => respondToPendingAction('confirm')}
                      >
                        {isConfirming ? <Loader2 className="size-4 animate-spin" /> : 'Bestätigen'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isConfirming}
                        onClick={() => respondToPendingAction('decline')}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {sendError && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                <span>{sendError}</span>
                {lastFailedContent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendMessage(lastFailedContent)}
                  >
                    Erneut senden
                  </Button>
                )}
              </div>
            )}
            <div ref={scrollAnchorRef} />
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht an den Assistenten..."
              rows={2}
              className="resize-none"
              aria-label="Chat-Nachricht"
            />
            <Button type="submit" size="icon" disabled={isSending || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
