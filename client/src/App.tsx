import React, { useState, useEffect } from 'react';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Layout, Button, Spin, message, List, Typography, Card, Row, Col, Input, Tooltip, Modal } from 'antd';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network, Provider, Types } from "aptos";
import { PlusOutlined, ReloadOutlined, LikeOutlined, SearchOutlined, ClearOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import './styles.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const provider = new Provider(Network.TESTNET);
const moduleAddress = "0x34d6b6437bfca564420f3d609e66dc3e4dc625fc1a390efdd55abc1940177819";

interface Quote {
  id: string;
  content: string;
  author: string;
  created_at: string;
  likes: number;
  owner: string;
  is_custom: boolean;
}

const App: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [customQuote, setCustomQuote] = useState({ content: '', author: '' });
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [likedQuotes, setLikedQuotes] = useState<Set<string>>(new Set());
  const [deletedQuoteIds, setDeletedQuoteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (account) {
      fetchQuotes();
    }
  }, [account]);

  const fetchQuotes = async (address: string = '') => {
    if (!account) return;
  
    try {
      setLoading(true);
      console.log("Fetching quotes for address:", address || account.address);
      
      const result = await provider.view({
        function: `${moduleAddress}::Quotes::get_all_quotes`,
        type_arguments: [],
        arguments: [address || account.address],
      });
  
      console.log("Raw result from blockchain:", JSON.stringify(result, null, 2));
  
      if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
        const quotesData = result[0];
        const formattedQuotes: Quote[] = quotesData
          .filter((quoteData: any) => !deletedQuoteIds.has(quoteData.id.toString()))
          .map((quoteData: any): Quote => ({
            id: quoteData.id.toString(),
            content: quoteData.content,
            author: quoteData.author,
            created_at: new Date(Number(quoteData.created_at) * 1000).toISOString(),
            likes: Number(quoteData.likes),
            owner: quoteData.owner,
            is_custom: Boolean(quoteData.is_custom),
          }));
        
        console.log("Formatted quotes:", JSON.stringify(formattedQuotes, null, 2));
  
        const sortedQuotes = formattedQuotes.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setQuotes(sortedQuotes);
        const newLikedQuotes = new Set<string>();
        sortedQuotes.forEach(quote => {
          if (quote.likes > 0) {
            newLikedQuotes.add(`${quote.owner}-${quote.id}`);
          }
        });
        setLikedQuotes(newLikedQuotes);
        
        if (address && formattedQuotes.length === 0) {
          message.info("There's no quotes available for this address");
        } else if (address) {
          message.success(`Found ${formattedQuotes.length} quotes for the address.`);
        }
      } else {
        console.log("No quotes found or invalid result structure");
        setQuotes([]);
        if (address) {
          message.info("There's no quotes available for this address");
        }
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      // Check if the error is due to the Quotes resource not being initialized
      if (error instanceof Error) {
        if (error.message.includes("ABORTED")) {
          setQuotes([]);
          message.info("There's no quotes available for this address");
        } else {
          message.error("Failed to fetch quotes. Please try again.");
        }
      } else {
        message.error("An unknown error occurred.");
      }
    
    } finally {
      setLoading(false);
    }
  };

  const toggleLikeQuote = async (quoteOwnerId: string, quoteId: string) => {
    if (!account) return;
  
    try {
      setLoading(true);
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::toggle_like_quote`,
        type_arguments: [],
        arguments: [quoteOwnerId, quoteId],
      };
  
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      message.success("Quote like toggled successfully!");
      fetchQuotes(searchAddress || account.address);
    } catch (error) {
      console.error("Error toggling quote like:", error);
      message.error("Failed to toggle quote like. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addQuote = async (quote: Quote, isCustom: boolean) => {
    if (!account) return;
  
    try {
      setLoading(true);
      console.log("Adding quote:", quote);
  
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::add_quote`,
        type_arguments: [],
        arguments: [quote.content, quote.author, isCustom],
      };
  
      console.log("Payload:", payload);
  
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      message.success("Quote added successfully!");
      if (isCustom) {
        setCustomQuote({ content: '', author: '' });
      } else {
        setRandomQuote(null);
      }
      await fetchQuotes();
    } catch (error) {
      console.error("Error adding quote:", error);
      message.error("Failed to add quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRandomQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api.quotable.io/random");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRandomQuote({
        id: data._id,
        content: data.content,
        author: data.author,
        created_at: new Date().toISOString(),
        likes: 0,
        owner: account!.address,
        is_custom: false,
      });
    } catch (error) {
      console.error("Error fetching random quote:", error);
      message.error("Failed to fetch random quote. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const deleteQuote = (quoteId: string) => {
    if (!account) return;

    setQuotes(prevQuotes => prevQuotes.filter(q => q.id !== quoteId));
    setDeletedQuoteIds(prev => new Set(prev).add(quoteId));
    message.success("Quote removed from the list.");
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: 'white', margin: 0 }}>Quote Manager</Title>
          </Col>
          <Col>
            <WalletSelector />
          </Col>
        </Row>
      </Header>
      <Content className="content">
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Random Quote" extra={<Button type="primary" icon={<ReloadOutlined />} onClick={fetchRandomQuote}>Get Random Quote</Button>}>
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
                      style={{ marginTop: '10px' }}
                    >
                      Add to My Quotes
                    </Button>
                  </>
                ) : (
                  <Text>Click the button to get a random quote.</Text>
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Add Custom Quote">
                <Input
                  placeholder="Enter quote content"
                  value={customQuote.content}
                  onChange={(e) => setCustomQuote({ ...customQuote, content: e.target.value })}
                  style={{ marginBottom: '10px' }}
                />
                <Input
                  placeholder="Enter quote author"
                  value={customQuote.author}
                  onChange={(e) => setCustomQuote({ ...customQuote, author: e.target.value })}
                  style={{ marginBottom: '10px' }}
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
                  }, true)}
                  disabled={!account || !customQuote.content || !customQuote.author}
                >
                  Add Custom Quote
                </Button>
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col xs={24}>
              <Card title="Search Quotes by Address">
                <Input
                  placeholder="Enter address to search"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onPressEnter={() => fetchQuotes(searchAddress)}
                  style={{ marginBottom: '10px' }}
                  suffix={
                    <Tooltip title={searchAddress ? "Search" : "Clear"}>
                      <Button
                        type="primary"
                        icon={searchAddress ? <SearchOutlined />  : <ClearOutlined />}
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
                  style={{ marginLeft: '10px' }}
                >
                  Refresh Quotes
                </Button>
              </Card>
            </Col>
          </Row>
          <Card title={searchAddress ? `Quotes for ${searchAddress}` : "My Quotes"} style={{ marginTop: '16px' }}>
  {quotes.length === 0 && (
    <Text>There's no quotes available for this address</Text>
  )}
  {quotes.length > 0 && (
    <List
      itemLayout="vertical"
      dataSource={quotes}
      renderItem={(quote) => (
        <List.Item
          actions={[
            <Button
              icon={<LikeOutlined />}
              onClick={() => toggleLikeQuote(quote.owner, quote.id)}
            >
              {likedQuotes.has(`${quote.owner}-${quote.id}`) ? 'Unlike' : 'Like'} ({quote.likes})
            </Button>,
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(`"${quote.content}" - ${quote.author}`);
                message.success('Quote copied to clipboard!');
              }}
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
                    content: 'This will only remove the quote from your local list.',
                    onOk: () => deleteQuote(quote.id),
                  });
                }}
              >
                Remove
              </Button>
            ),
          ]}
        >
          <List.Item.Meta
            title={<Text strong>"{quote.content}"</Text>}
            description={
              <>
                <Text italic>- {quote.author}</Text>
                <br />
                <Text type="secondary">Added at: {new Date(quote.created_at).toLocaleString()}</Text>
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

        </Spin>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Quote Manager ©{new Date().getFullYear()} Created with Aptos</Footer>
    </Layout>
  );
};

export default App;