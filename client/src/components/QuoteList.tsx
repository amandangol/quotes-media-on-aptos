import React from 'react';
import { Card, List, Button, Typography, Modal } from 'antd';
import { LikeOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuoteContext } from '../contexts/QuoteContext';

const { Text } = Typography;

const QuoteList: React.FC = () => {
  const { quotes, searchAddress, toggleLikeQuote, deleteQuote, account } = useQuoteContext();

  return (
    <Card 
      title={searchAddress ? `Quotes for ${searchAddress}` : "My Quotes"} 
      className="quote-list-card"
    >
      {quotes.length === 0 ? (
        <Text>There's no quotes available for this address</Text>
      ) : (
        <List
          itemLayout="vertical"
          dataSource={quotes}
          renderItem={(quote) => (
            <List.Item
              actions={[
                <Button
                icon={<LikeOutlined />}
                onClick={() => toggleLikeQuote(quote.owner, quote.id)}
                className="quote-action-button"
              >
                    {quote.liked_by.includes(account?.address || '') ? 'Unlike' : 'Like'} ({quote.likes})

                </Button>,
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(`"${quote.content}" - ${quote.author}`);
                    Modal.success({ content: 'Quote copied to clipboard!' });
                  }}
                  className="quote-action-button"
                >
                  Copy Quote
                </Button>,
                account?.address === quote.owner && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Are you sure you want to remove this quote?',
                        content: 'This will only remove the quote from your list.',
                        onOk: () => deleteQuote(quote.id),
                      });
                    }}
                    className="quote-action-button"
                  >
                    Remove
                  </Button>
                ),
              ]}
              className="quote-list-item"
            >
              <List.Item.Meta
                title={<Text strong>"{quote.content}"</Text>}
                description={
                  <>
                    <Text italic>- {quote.author}</Text>
                    <br />
                    <Text type="secondary">{new Date(quote.created_at).toLocaleString()}</Text>
                    <br />
                    <Text type="secondary">Owner: {quote.owner}</Text>
                    <br />
                    <Text type="secondary">{quote.is_custom ? 'Custom Quote' : 'API Quote'}</Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default QuoteList;