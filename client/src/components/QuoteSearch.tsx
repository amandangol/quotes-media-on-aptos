import React from 'react';
import { Card, Input, Button, Tooltip, Space } from 'antd';
import { SearchOutlined, ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuoteContext } from '../contexts/QuoteContext';

const QuoteSearch: React.FC = () => {
  const { searchAddress, setSearchAddress, fetchQuotes, account, clearSearch } = useQuoteContext();

  const handleSearch = () => {
    if (searchAddress) {
      fetchQuotes(searchAddress);
    }
  };

  return (
    <Card title="Search Quotes by Address" className="quote-search-card">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="Enter address to search"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onPressEnter={handleSearch}
          className="search-input"
          suffix={
            <Tooltip title="Search">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                disabled={!account || !searchAddress}
              />
            </Tooltip>
          }
        />
        <Space>
          <Button
            type="primary"
            icon={<ClearOutlined />}
            onClick={clearSearch}
            disabled={!account || !searchAddress}
          >
            Clear Search
          </Button>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => fetchQuotes(searchAddress || account?.address)}
            disabled={!account}
          >
            Refresh Quotes
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default QuoteSearch;