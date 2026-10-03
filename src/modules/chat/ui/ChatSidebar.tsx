import { useState } from 'react'
import type { GreenApiCredentials } from '../../../shared/api/green-api/types'
import type { Conversation } from '../model/types'
import { NewChatForm } from './NewChatForm'
import { ChatList } from './ChatList'
import styles from './ChatSidebar.module.css'

interface ChatSidebarProps {
  credentials: GreenApiCredentials
  conversations: Conversation[]
  activeId: string | null
  onOpen: (chatId: string, phone: string) => void
  onSelect: (chatId: string) => void
  onDisconnect: () => void
}

export function ChatSidebar({ credentials, conversations, activeId, onOpen, onSelect, onDisconnect }: ChatSidebarProps) {
  const [showNewChat, setShowNewChat] = useState(false)
  function open(chatId: string, phone: string) { onOpen(chatId, phone); setShowNewChat(false) }
  return (
    <aside className={styles.sidebar} aria-label="Чаты">
      <header className={styles.header}>
        <div><h1>Telegram</h1><p>Инстанс {credentials.idInstance}</p></div>
        <button className={styles.action} type="button" onClick={onDisconnect}>Выйти</button>
      </header>
      <button className={styles.newChat} type="button" aria-expanded={showNewChat} onClick={() => setShowNewChat((value) => !value)}>
        {showNewChat ? 'Отменить' : '+ Новый чат'}
      </button>
      {showNewChat && <NewChatForm credentials={credentials} conversations={conversations} onOpen={open} />}
      <ChatList conversations={conversations} activeId={activeId} onSelect={onSelect} />
    </aside>
  )
}
