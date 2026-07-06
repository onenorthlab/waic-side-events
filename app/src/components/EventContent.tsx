import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * 活动正文渲染：兼容两代内容格式。
 * - 旧数据（早期后台富文本）是 HTML 字符串
 * - 新导入（公众号/文档）统一为 Markdown，主办方原文原图保真呈现
 * 判定规则：显式 format 优先；否则以首个非空白字符是否为 '<' 判 HTML。
 */
export function EventContent({ content, format }: { content: string; format?: string | null }) {
  const isHtml = format === 'html' || (format !== 'markdown' && content.trimStart().startsWith('<'))
  if (isHtml) {
    return <div className="prose-event text-[15px]" dangerouslySetInnerHTML={{ __html: content }} />
  }
  return (
    <div className="prose-event text-[15px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
