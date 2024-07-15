// InitializeButton.tsx
import React from 'react';
import { Button, Tooltip } from 'antd';
import { useQuoteContext } from '../contexts/QuoteContext';

const InitializeButton: React.FC = () => {
  const { initializeQuotes, loading } = useQuoteContext();

  return (
    <Tooltip title="Initialize the quote system if you haven't already">
      <Button
        onClick={initializeQuotes}
        loading={loading}
        type="primary"
      >
        Initialize Quote System
      </Button>
    </Tooltip>
  );
};

export default InitializeButton;