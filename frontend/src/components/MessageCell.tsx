import { FC, useState } from 'react'

interface MessageCellProps {
  message: string
}

const MessageCell: FC<MessageCellProps> = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const maxLength = 50
  const isLongMessage = message.length > maxLength
  const displayMessage = isExpanded || !isLongMessage 
    ? message 
    : `${message.slice(0, maxLength)}...`

  const toggleExpanded = () => {
    if (isLongMessage) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="message-cell">
      <div 
        className={`message-content ${isLongMessage ? 'expandable' : ''}`}
        onClick={toggleExpanded}
        title={isLongMessage && !isExpanded ? message : undefined}
      >
        {displayMessage}
      </div>
    </div>
  )
}

interface MessageCellWrapperProps {
  message: string | null
}

export const MessageCellWrapper: FC<MessageCellWrapperProps> = ({ message }) => {
  if (!message) {
    return <span className="no-message">No message</span>
  }
  
  return <MessageCell message={message} />
}