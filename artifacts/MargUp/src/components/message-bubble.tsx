import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@workspace/api-client-react';
import { Markdown } from './markdown';

export const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: Message;
}) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
          <Bot className="h-4 w-4" />
        </span>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-xl border p-4 sm:max-w-[78%]',
          isUser
            ? 'rounded-br-sm border-transparent bg-primary text-primary-foreground'
            : 'rounded-bl-sm border-border bg-card',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        ) : (
          <Markdown content={message.content} />
        )}
        <p
          className={cn(
            'mt-2 text-[11px]',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {new Date(message.createdAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
});
