'use client'

import { useChat } from '@ai-sdk/react'
import { MarkdownWrapper } from './_components/MarkdownWrapper'
import { useEffect, useRef } from 'react'

export default function Page() {
  const {
    messages,
    input,
    handleSubmit,
    handleInputChange,
    status,
    stop,
  } = useChat({
    api: '/api/chat',
  })

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // コンポーネントがマウントされたときにinputにフォーカス
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <div className="flex h-full flex-col max-w-3xl mx-auto py-10">
      <div className="flex-1 space-y-4 overflow-y-auto ">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg p-3 ${
              message.role === 'user' ? 'ml-auto bg-blue-100' : 'bg-gray-100'
            } max-w-[80%] ${message.role === 'user' ? 'ml-auto' : ''}`}
          >
            <MarkdownWrapper>{message.content}</MarkdownWrapper>
          </div>
        ))}
        {status === 'submitted' && (
          <div className="max-w-[80%] rounded-lg bg-gray-100 p-3">
            <p>レスポンスを生成中...</p>
          </div>
        )}
      </div>

      <div className="md:p-4">
        <form
          onSubmit={(event) => handleSubmit(event)}
          className="flex flex-col gap-2"
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              placeholder=""
              onChange={handleInputChange}
              disabled={status !== 'ready' && status !== undefined}
              className="w-full rounded-lg border p-2"
            />
            <button
              type="submit"
              disabled={status !== 'ready' && status !== undefined}
              className="whitespace-nowrap text-white font-bold rounded-lg bg-blue-500 px-4 py-2 disabled:bg-blue-300"
            >
              送信
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
