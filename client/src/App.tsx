import React, { useState, useEffect } from 'react';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Layout, Button, Spin, message, List, Typography, Card, Row, Col, Input } from 'antd';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network, Provider, Types } from "aptos";
import { PlusOutlined, ShareAltOutlined, CopyOutlined, ReloadOutlined, LikeOutlined } from '@ant-design/icons';
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
  shared: boolean;
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

  useEffect(() => {
    if (account) {
      fetchOwnerQuotes();
    }
  }, [account]);

  const fetchOwnerQuotes = async () => {
    if (!account) return;

    try {
      setLoading(true);
      console.log("Fetching quotes for owner:", account.address);
      
      const result = await provider.view({
        function: `${moduleAddress}::Quotes::get_quotes_for_address`,
        type_arguments: [],
        arguments: [account.address],
      });

      console.log("Raw result from blockchain (owner quotes):", JSON.stringify(result, null, 2));

      if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
        const quotesData = result[0];
        const formattedQuotes: Quote[] = quotesData.map((quoteData: any): Quote => ({
          id: quoteData.id.toString(),
          content: quoteData.content,
          author: quoteData.author,
          created_at: new Date(Number(quoteData.created_at) * 1000).toISOString(),
          shared: Boolean(quoteData.shared),
          likes: Number(quoteData.likes),
          owner: quoteData.owner,
          is_custom: Boolean(quoteData.is_custom),
        }));
        
        console.log("Formatted owner quotes:", JSON.stringify(formattedQuotes, null, 2));

        const sortedQuotes = formattedQuotes.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setQuotes(sortedQuotes);
      } else {
        console.log("No owner quotes found or invalid result structure");
        setQuotes([]);
      }
    } catch (error) {
      console.error("Error fetching owner quotes:", error);
      message.error("Failed to fetch owner quotes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const searchQuotesByAddress = async () => {
    if (!account) return;

    if (!searchAddress.trim()) {
      await fetchOwnerQuotes();
      return;
    }

    try {
      setLoading(true);
      console.log("Searching quotes for address:", searchAddress);
      
      const result = await provider.view({
        function: `${moduleAddress}::Quotes::search_quotes_by_address`,
        type_arguments: [],
        arguments: [account.address, searchAddress],
      });

      console.log("Raw result from blockchain (search):", JSON.stringify(result, null, 2));

      if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
        const quotesData = result[0];
        const formattedQuotes: Quote[] = quotesData.map((quoteData: any): Quote => ({
          id: quoteData.id.toString(),
          content: quoteData.content,
          author: quoteData.author,
          created_at: new Date(Number(quoteData.created_at) * 1000).toISOString(),
          shared: Boolean(quoteData.shared),
          likes: Number(quoteData.likes),
          owner: quoteData.owner,
          is_custom: Boolean(quoteData.is_custom),
        }));
        
        console.log("Formatted search quotes:", JSON.stringify(formattedQuotes, null, 2));

        const sortedQuotes = formattedQuotes.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setQuotes(sortedQuotes);
        
        if (formattedQuotes.length === 0) {
          message.info("No quotes found for this address.");
        } else {
          message.success(`Found ${formattedQuotes.length} quotes for the address.`);
        }
      } else {
        console.log("No quotes found or invalid result structure");
        setQuotes([]);
        message.info("No quotes found for this address.");
      }
    } catch (error) {
      console.error("Error searching quotes:", error);
      message.error("Failed to search quotes. Please try again.");
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
      await fetchOwnerQuotes();
    } catch (error) {
      console.error("Error adding quote:", error);
      message.error("Failed to add quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const shareQuote = async (quoteId: string) => {
    if (!account) return;

    try {
      setLoading(true);
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::share_quote`,
        type_arguments: [],
        arguments: [quoteId],
      };

      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      message.success("Quote shared successfully!");
      fetchOwnerQuotes();
    } catch (error) {
      console.error("Error sharing quote:", error);
      message.error("Failed to share quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const likeQuote = async (quoteOwnerId: string, quoteId: string) => {
    if (!account) return;

    try {
      setLoading(true);
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::like_quote`,
        type_arguments: [],
        arguments: [quoteOwnerId, quoteId],
      };

      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      message.success("Quote liked successfully!");
      searchQuotesByAddress(); // Refresh the current view
    } catch (error) {
      console.error("Error liking quote:", error);
      message.error("Failed to like quote. Please try again.");
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
        shared: false,
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

  const getShareableLink = (quoteId: string) => {
    return `${window.location.origin}/quote/${account?.address}/${quoteId}`;
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
                    shared: false,
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
                  style={{ marginBottom: '10px' }}
                />
                <Button
                  type="primary"
                  onClick={searchQuotesByAddress}
                  disabled={!account}
                >
                  {searchAddress.trim() ? 'Search Quotes' : 'Show My Quotes'}
                </Button>
              </Card>
            </Col>
          </Row>
          <Card title={searchAddress ? `Quotes for ${searchAddress}` : "My Quotes"} style={{ marginTop: '16px' }}>
            <List
              itemLayout="vertical"
              dataSource={quotes}
              renderItem={(quote) => (
                <List.Item
                  actions={[
                    <Button
                      icon={<LikeOutlined />}
                      onClick={() => likeQuote(quote.owner, quote.id)}
                    >
                      Like ({quote.likes})
                    </Button>,
                    <Button 
                      type={quote.shared ? 'default' : 'primary'}
                      icon={<ShareAltOutlined />}
                      onClick={() => shareQuote(quote.id)} 
                      disabled={quote.shared || quote.owner !== account?.address}
                    >
                      {quote.shared ? 'Shared' : 'Share'}
                    </Button>,
                    quote.shared && (
                      <Button 
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(getShareableLink(quote.id));
                          message.success('Shareable link copied to clipboard!');
                        }}
                      >
                        Copy Link
                      </Button>
                    )
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
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Spin>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Quote Manager ©{new Date().getFullYear()} Created with Aptos</Footer>
    </Layout>
  );
};

export default App;