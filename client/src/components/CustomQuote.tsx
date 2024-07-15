import React from 'react';
import { Card, Input, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuoteContext } from '../contexts/QuoteContext';

const CustomQuote: React.FC = () => {
  const { customQuote, setCustomQuote, addQuote, account } = useQuoteContext();

  return (
    <Card title="Add Custom Quote" className="quote-card custom-quote-card">
      <Input
        placeholder="Enter quote content"
        value={customQuote.content}
        onChange={(e) => setCustomQuote({ ...customQuote, content: e.target.value })}
        className="custom-quote-input"
      />
      <Input
        placeholder="Enter quote author"
        value={customQuote.author}
        onChange={(e) => setCustomQuote({ ...customQuote, author: e.target.value })}
        className="custom-quote-input"
      />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => addQuote({
          ...customQuote,
          id: '',
          created_at: new Date().toISOString(),
          likes: 0,
          owner: account!.address,
          is_custom: true,
          liked_by: [],
        }, true)}
        disabled={!account || !customQuote.content || !customQuote.author}
        className="add-custom-quote-button"
      >
        Add Custom Quote
      </Button>
    </Card>
  );
};

export default CustomQuote;