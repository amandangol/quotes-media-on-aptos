import React from 'react';
import { Card, Button, Typography } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuoteContext } from '../contexts/QuoteContext';

const { Text } = Typography;

const RandomQuote: React.FC = () => {
  const { randomQuote, fetchRandomQuote, addQuote, account } = useQuoteContext();

  return (
    <Card 
      title="Random Quote" 
      extra={<Button type="primary" icon={<ReloadOutlined />} onClick={fetchRandomQuote}>Get Random Quote</Button>}
      className="quote-card random-quote-card"
    >
      {randomQuote ? (
        <>
          <Text strong>"{randomQuote.content}"</Text>
          <br />
          <Text italic>- {randomQuote.author}</Text>
          <br />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => addQuote(randomQuote, false)} 
            disabled={!account}
            className="add-quote-button"
          >
            Add to My Quotes
          </Button>
        </>
      ) : (
        <Text>Click the button to get a random quote.</Text>
      )}
    </Card>
  );
};

export default RandomQuote;