import React, { useState, useEffect } from 'react';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Layout, Button, Spin, message, List, Typography, Card, Row, Col } from 'antd';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network, Provider, Types } from "aptos";
import { PlusOutlined, ShareAltOutlined, CopyOutlined, ReloadOutlined, LikeOutlined } from '@ant-design/icons';
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import './styles.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const provider = new Provider(Network.TESTNET);
const moduleAddress = "0x62d96c7a6d1a927fa30a811c68f950eb021331aeca380a4c9a53c6e41b6575de";

interface Quote {
  id: string;
  content: string;
  author: string;
  created_at: string;
  shared: boolean;
  likes: number;
  ownerId: string;
}

const App: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("Current quotes state:", quotes);
  }, [quotes]);

  const initializeQuotes = async () => {
    if (!account) return;
  
    try {
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::initialize`,
        type_arguments: [],
        arguments: [],
      };
  
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      console.log("Quotes initialized");
    } catch (error) {
      console.error("Error initializing quotes:", error);
      // The initialization might fail if it's already been done, which is fine
      // We can still try to fetch quotes even if initialization fails
    }
  };
  
  // In your useEffect or wallet connection handler
  useEffect(() => {
    if (account) {
      initializeQuotes().then(() => fetchAllQuotes());
    }
  }, [account]);

  const fetchAllQuotes = async () => {
    if (!account) return;
  
    try {
      setLoading(true);
      console.log("Fetching all quotes for address:", account.address);
      
      const result = await provider.view({
        function: `${moduleAddress}::Quotes::get_all_quotes`,
        type_arguments: [],
        arguments: [account.address],
      });
  
      console.log("Raw result from get_all_quotes:", JSON.stringify(result, null, 2));
      console.log("Type of result:", typeof result);
      console.log("Is array:", Array.isArray(result));
  
      if (Array.isArray(result) && result.length > 0) {
        console.log("Result is an array with length:", result.length);
        console.log("First item in array:", JSON.stringify(result[0], null, 2));
  
        const formattedQuotes: Quote[] = result.flatMap((item: any) => {
          if (Array.isArray(item)) {
            return item.map((quote: any, index: number): Quote => {
              console.log(`Processing nested quote ${index}:`, JSON.stringify(quote, null, 2));
              return {
                id: quote.id?.toString() ?? `unknown_${index}`,
                content: quote.content ?? 'No content',
                author: quote.author ?? 'Unknown author',
                created_at: quote.created_at 
                  ? new Date(Number(quote.created_at) * 1000).toISOString()
                  : new Date().toISOString(),
                shared: Boolean(quote.shared),
                likes: Number(quote.likes ?? 0),
                ownerId: quote.owner ?? 'Unknown owner',
              };
            });
          } else {
            console.log("Unexpected item structure:", JSON.stringify(item, null, 2));
            return [];
          }
        });
        
        console.log("Formatted quotes:", JSON.stringify(formattedQuotes, null, 2));
        setQuotes(formattedQuotes);
      } else {
        console.log("Result is not a non-empty array:", result);
        setQuotes([]);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      message.error("Failed to fetch quotes. Please try again.");
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
      fetchAllQuotes();  // Refresh all quotes after liking
    } catch (error) {
      console.error("Error liking quote:", error);
      message.error("Failed to like quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkQuotesResourceExists = async () => {
    if (!account) return;
  
    try {
      const result = await provider.getAccountResource(
        account.address,
        `${moduleAddress}::Quotes::Quotes`
      );
      console.log("Quotes resource exists:", result);
      message.success("Quotes resource exists for this account");
    } catch (error) {
      console.error("Error checking Quotes resource:", error);
      message.error("Quotes resource does not exist for this account. Try initializing.");
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
        likes:0,
        ownerId: account!.address,
      });
    } catch (error) {
      console.error("Error fetching random quote:", error);
      message.error("Failed to fetch random quote. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const addQuote = async () => {
    if (!account || !randomQuote) return;
  
    try {
      setLoading(true);
      console.log("Adding quote:", randomQuote);
  
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::add_quote`,
        type_arguments: [],
        arguments: [randomQuote.content, randomQuote.author],
      };
  
      console.log("Payload:", payload);
  
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      message.success("Quote added successfully!");
      setRandomQuote(null);
      await fetchAllQuotes(); // Fetch quotes after adding
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
      fetchAllQuotes();
    } catch (error) {
      console.error("Error sharing quote:", error);
      message.error("Failed to share quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const manualRefresh = () => {
    fetchAllQuotes();
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
                      onClick={addQuote} 
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
              <Card title="Actions" extra={<Button type="primary" icon={<ReloadOutlined />} onClick={manualRefresh}>Refresh Quotes</Button>}>
                <Button onClick={checkQuotesResourceExists} style={{ marginRight: '10px' }}>Check Quotes Resource</Button>
                <Button onClick={initializeQuotes}>Initialize Quotes</Button>
              </Card>
            </Col>
          </Row>
          <Card title="My Quotes" style={{ marginTop: '16px' }}>
            <List
              itemLayout="vertical"
              dataSource={quotes}
              renderItem={(quote) => (
                <List.Item
                  actions={[
                    <Button
                      icon={<LikeOutlined />}
                      onClick={() => likeQuote(quote.ownerId, quote.id)}
                    >
                      Like ({quote.likes})
                    </Button>,
                    <Button 
                      type={quote.shared ? 'default' : 'primary'}
                      icon={<ShareAltOutlined />}
                      onClick={() => shareQuote(quote.id)} 
                      disabled={quote.shared}
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
                        <Text type="secondary">Owner: {quote.ownerId}</Text>
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
