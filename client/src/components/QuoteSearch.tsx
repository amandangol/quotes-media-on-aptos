import React from 'react';
import { Card, Input, Button, Tooltip } from 'antd';
import { SearchOutlined, ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuoteContext } from '../contexts/QuoteContext';

const QuoteSearch: React.FC = () => {
  const { searchAddress, setSearchAddress, fetchQuotes, account } = useQuoteContext();

  return (
    <Card title="Search Quotes by Address" className="quote-search-card">
      <Input
        placeholder="Enter address to search"
        value={searchAddress}
        onChange={(e) => setSearchAddress(e.target.value)}
        onPressEnter={() => fetchQuotes(searchAddress)}
        className="search-input"
        suffix={
          <Tooltip title={searchAddress ? "Search" : "Clear"}>
            <Button
              type="primary"
              icon={searchAddress ? <SearchOutlined /> : <ClearOutlined />}
              onClick={() => {
                if (searchAddress) {
                  fetchQuotes(searchAddress);
                } else {
                  setSearchAddress('');
                  fetchQuotes(account?.address || '');
                }
              }}
              disabled={!account}
            />
          </Tooltip>
        }
      />
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={() => fetchQuotes(searchAddress || account?.address)}
        disabled={!account}
        className="refresh-button"
      >
        Refresh Quotes
      </Button>
    </Card>
  );
};

export default QuoteSearch;