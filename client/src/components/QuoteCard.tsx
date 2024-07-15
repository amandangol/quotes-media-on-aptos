import React from 'react';
import { Card, Button, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Quote {
  content: string;
  author: string;
}

interface QuoteCardProps {
  title: string;
  quote?: Quote | null;
  onAdd: () => void;
  onFetch: () => void;
  buttonText: string;
  isAddDisabled?: boolean;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ title, quote, onAdd, onFetch, buttonText, isAddDisabled }) => {
  return (
    <Card title={title} extra={<Button type="primary" icon={<ReloadOutlined />} onClick={onFetch}>Get Quote</Button>}>
      {quote ? (
        <>
          <Text strong>"{quote.content}"</Text>
          <br />
          <Text italic>- {quote.author}</Text>
          <br />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAdd}
            disabled={isAddDisabled}
            style={{ marginTop: '10px' }}
          >
            {buttonText}
          </Button>
        </>
      ) : (
        <Text>Click the button to get a quote.</Text>
      )}
    </Card>
  );
};

export default QuoteCard;
