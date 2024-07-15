import React, { createContext, useState, useContext, useEffect } from 'react';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network, Provider, Types } from "aptos";
import { message } from 'antd';

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

interface QuoteContextType {
  quotes: Quote[];
  randomQuote: Quote | null;
  customQuote: { content: string; author: string };
  searchAddress: string;
  likedQuotes: Set<string>;
  account: any;
  loading: boolean;
  fetchQuotes: (address?: string) => Promise<void>;
  toggleLikeQuote: (quoteOwnerId: string, quoteId: string) => Promise<void>;
  addQuote: (quote: Quote, isCustom: boolean) => Promise<void>;
  fetchRandomQuote: () => Promise<void>;
  setCustomQuote: React.Dispatch<React.SetStateAction<{ content: string; author: string }>>;
  setSearchAddress: React.Dispatch<React.SetStateAction<string>>;
  deleteQuote: (quoteId: string) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    <QuoteContext.Provider value={{
      quotes,
      randomQuote,
      customQuote,
      searchAddress,
      likedQuotes,
      account,
      loading,
      fetchQuotes,
      toggleLikeQuote,
      addQuote,
      fetchRandomQuote,
      setCustomQuote,
      setSearchAddress,
      deleteQuote,
    }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuoteContext = () => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuoteContext must be used within a QuoteProvider');
  }
  return context;
};