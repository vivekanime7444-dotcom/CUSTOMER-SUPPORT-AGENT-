import React from 'react';
import { 
  Package, CheckCircle2, Clock, Truck, ShieldCheck, 
  ArrowRight, AlertCircle, Sparkles, Tag, DollarSign, Calendar
} from 'lucide-react';

/**
 * Normalizes chat text to prevent run-on bullets and messy inline markdown
 */
function normalizeChatText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText;

  // Insert newlines before inline bullet points like " - **Product:**" or " - Item"
  cleaned = cleaned.replace(/([^\n])\s+-\s+(\*{1,2}[A-Za-z0-9\s/_-]+:?\*{1,2})/g, '$1\n- $2');
  cleaned = cleaned.replace(/([^\n])\s+-\s+([A-Za-z0-9])/g, '$1\n- $2');

  // Insert double newlines before section headers like "**Next steps:**" or "**Order details:**"
  cleaned = cleaned.replace(/([^\n])\s+(\*\*(?:Next steps|Order details|Status|Important|Summary|Please note|Delivery details):?\*\*)/gi, '$1\n\n$2');

  // Fix trailing typos like "!m" at the very end
  cleaned = cleaned.replace(/([.!?])m$/i, '$1');

  return cleaned.trim();
}

/**
 * Renders inline text with rich elements (bold, status pills, order badges)
 */
function renderInlineText(text) {
  if (!text) return null;

  // Split tokens by **bold**, order IDs, and status keywords
  // Regex captures:
  // 1) **bold content**
  // 2) Order IDs like (NM-\d{4,6})
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|NM-\d{4,6}|VM-\d{4,6})/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2).trim();
      
      // Check if the bold text is an order status keyword
      const upper = inner.toUpperCase().replace(/\s+/g, '_');
      if (['CONFIRMED', 'DELIVERED', 'SHIPPED', 'PROCESSING', 'ORDER_PLACED', 'CANCELLED', 'PENDING'].includes(upper)) {
        parts.push({
          type: 'status',
          status: upper,
          label: inner
        });
      } else if (/^(order\s+)?(NM|VM)-\d{4,6}$/i.test(inner)) {
        parts.push({
          type: 'orderId',
          id: inner.replace(/^order\s+/i, '')
        });
      } else {
        parts.push({
          type: 'bold',
          content: inner
        });
      }
    } else if (/^(NM|VM)-\d{4,6}$/i.test(token)) {
      parts.push({
        type: 'orderId',
        id: token
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return parts.map((part, idx) => {
    if (part.type === 'text') {
      return <span key={idx}>{part.content}</span>;
    }
    if (part.type === 'bold') {
      return (
        <strong key={idx} style={{ color: '#ffffff', fontWeight: 650 }}>
          {part.content}
        </strong>
      );
    }
    if (part.type === 'orderId') {
      return (
        <span 
          key={idx}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            padding: '1px 7px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'monospace',
            margin: '0 2px'
          }}
        >
          #{part.id}
        </span>
      );
    }
    if (part.type === 'status') {
      const statusStyles = {
        CONFIRMED: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' },
        DELIVERED: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
        SHIPPED: { bg: 'rgba(139, 92, 246, 0.2)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.4)' },
        PROCESSING: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' },
        ORDER_PLACED: { bg: 'rgba(6, 182, 212, 0.2)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.4)' },
        CANCELLED: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' },
        PENDING: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' }
      };
      const s = statusStyles[part.status] || { bg: 'rgba(255, 255, 255, 0.1)', text: '#cbd5e1', border: 'rgba(255, 255, 255, 0.2)' };
      return (
        <span 
          key={idx}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: s.bg,
            color: s.text,
            border: `1px solid ${s.border}`,
            padding: '2px 8px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.4px',
            margin: '0 3px',
            textTransform: 'uppercase'
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.text }} />
          {part.label}
        </span>
      );
    }
    return null;
  });
}

/**
 * Key-Value Icon resolver
 */
function getFieldIcon(key) {
  const k = key.toLowerCase();
  if (k.includes('product') || k.includes('item')) return <Package size={14} color="#818cf8" />;
  if (k.includes('price') || k.includes('amount') || k.includes('total')) return <DollarSign size={14} color="#34d399" />;
  if (k.includes('date') || k.includes('time')) return <Calendar size={14} color="#fbbf24" />;
  if (k.includes('status')) return <ShieldCheck size={14} color="#60a5fa" />;
  if (k.includes('quantity') || k.includes('qty')) return <Tag size={14} color="#a78bfa" />;
  return <Package size={14} color="#94a3b8" />;
}

const FormattedMessage = ({ text, sender }) => {
  if (!text) return null;

  const normalized = normalizeChatText(text);
  const rawParagraphs = normalized.split(/\n{2,}/);
  const kvRegex = /^-\s*\*\*([A-Za-z0-9\s/_-]+):\*\*\s*(.*)$/i;

  const renderedBlocks = [];

  rawParagraphs.forEach((para, pIdx) => {
    const lines = para.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // Check if entire block or tail is a series of key-value pairs
    let headerLine = null;
    let listLines = lines;

    if (lines.length > 1 && (lines[0].endsWith(':') || lines[0].endsWith('**')) && !lines[0].startsWith('- ')) {
      headerLine = lines[0];
      listLines = lines.slice(1);
    }

    const kvItems = [];
    let isKvBlock = listLines.length >= 2;

    for (const line of listLines) {
      const match = line.match(kvRegex);
      if (match) {
        kvItems.push({ key: match[1].trim(), val: match[2].trim() });
      } else {
        isKvBlock = false;
        break;
      }
    }

    // Render Order Details Card
    if (isKvBlock && kvItems.length >= 2) {
      if (headerLine) {
        renderedBlocks.push(
          <div key={`head-${pIdx}`} style={{ marginBottom: '8px', fontSize: '14.5px', fontWeight: 600, color: '#f8fafc' }}>
            {renderInlineText(headerLine)}
          </div>
        );
      }
      renderedBlocks.push(
        <div 
          key={`kv-${pIdx}`}
          style={{
            background: 'rgba(10, 14, 26, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '12px 16px',
            margin: '10px 0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: '#a5b4fc',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '8px',
            marginBottom: '10px'
          }}>
            <Sparkles size={13} /> Order Information
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {kvItems.map((item, i) => (
              <div 
                key={i} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontWeight: 500 }}>
                  {getFieldIcon(item.key)}
                  <span>{item.key}</span>
                </div>
                <div style={{ fontWeight: 600, color: '#f8fafc', textAlign: 'right' }}>
                  {renderInlineText(item.val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      return;
    }

    // Check if Next Steps block
    const isNextStepsHeader = lines[0].toLowerCase().includes('next steps') || lines[0].toLowerCase().includes('what happens next');
    if (isNextStepsHeader && lines.length > 1) {
      renderedBlocks.push(
        <div 
          key={`steps-${pIdx}`}
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '14px',
            padding: '14px 16px',
            margin: '10px 0'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '13px',
            color: '#818cf8',
            marginBottom: '8px'
          }}>
            <Truck size={16} /> Next Steps
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {lines.slice(1).map((l, sIdx) => {
              const cleanedLine = l.replace(/^[-*]\s+/, '');
              return (
                <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: '#cbd5e1' }}>
                  <ArrowRight size={14} color="#818cf8" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <div>{renderInlineText(cleanedLine)}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
      return;
    }

    // Check if regular bullet list
    const isList = lines.every(l => l.startsWith('- ') || l.startsWith('* '));
    if (isList) {
      renderedBlocks.push(
        <ul key={`list-${pIdx}`} style={{ margin: '8px 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {lines.map((l, lIdx) => {
            const cleaned = l.replace(/^[-*]\s+/, '');
            return (
              <li key={lIdx} style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: '1.5' }}>
                {renderInlineText(cleaned)}
              </li>
            );
          })}
        </ul>
      );
      return;
    }

    // Standard Paragraph with possible linebreaks
    renderedBlocks.push(
      <div 
        key={`p-${pIdx}`} 
        style={{ 
          fontSize: '14px', 
          lineHeight: '1.65', 
          color: sender === 'user' ? '#ffffff' : '#f1f5f9',
          marginBottom: pIdx === rawParagraphs.length - 1 ? 0 : '8px'
        }}
      >
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {renderInlineText(line)}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    );
  });

  return <div className="formatted-message-container">{renderedBlocks}</div>;
};

export default FormattedMessage;
