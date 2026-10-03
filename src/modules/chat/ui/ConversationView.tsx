import type { Conversation } from '../model/types'
import { ConversationHeader } from './ConversationHeader'
import { MessageList } from './MessageList'
import { MessageComposer } from './MessageComposer'
import styles from './ConversationView.module.css'

interface ConversationViewProps {
  chat: Conversation; isSending: boolean; error: string
  onSend: (text: string) => Promise<boolean>; onBack: () => void
}

export function ConversationView({ chat, isSending, error, onSend, onBack }: ConversationViewProps) {
  return (
    <div className={styles.view}>
      <ConversationHeader chat={chat} onBack={onBack} />
      <MessageList messages={chat.messages} />
      <MessageComposer isSending={isSending} error={error} onSend={onSend} />
    </div>
  )
}
