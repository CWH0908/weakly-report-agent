import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent: React.FCC<MarkdownContentProps> = ({ content }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }: any) => <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '16px 0 12px' }}>{children}</h1>,
          h2: ({ children }: any) => <h2 style={{ fontSize: '1.3em', fontWeight: 'bold', margin: '14px 0 10px' }}>{children}</h2>,
          h3: ({ children }: any) => <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '12px 0 8px' }}>{children}</h3>,
          ul: ({ children }: any) => <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>{children}</ul>,
          ol: ({ children }: any) => <ol style={{ paddingLeft: '20px', margin: '8px 0' }}>{children}</ol>,
          li: ({ children }: any) => <li style={{ margin: '4px 0' }}>{children}</li>,
          p: ({ children }: any) => <p style={{ margin: '8px 0', lineHeight: '1.6' }}>{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
