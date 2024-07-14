module 0x1081f1c161922255c6f109c53e6ce73c9d6bc7244febc298bb544c67368fa05e::Quotes {
    use std::signer;
    use std::string::String;
    use aptos_std::table::{Self, Table};
    use aptos_framework::timestamp;
    use std::vector;

    const E_QUOTE_DOES_NOT_EXIST: u64 = 101;
    const E_CANNOT_LIKE_OWN_QUOTE: u64 = 102;
    const E_ALREADY_LIKED: u64 = 103;

    struct Quote has store, drop, copy {
        id: u64,
        content: String,
        author: String,
        created_at: u64,
        shared: bool,
        likes: u64,
    }

    struct Quotes has key {
        quote_list: Table<u64, Quote>,
        next_id: u64,
        likes: Table<u64, Table<address, bool>>,
    }

    public entry fun initialize(account: &signer) {
        if (!exists<Quotes>(signer::address_of(account))) {
            let quotes = Quotes {
                quote_list: table::new(),
                next_id: 0,
                likes: table::new(),
            };
            move_to(account, quotes);
        }
    }

    public entry fun add_quote(account: &signer, content: String, author: String) acquires Quotes {
        let address = signer::address_of(account);
        assert!(exists<Quotes>(address), 0);

        let quotes = borrow_global_mut<Quotes>(address);
        let created_at = timestamp::now_seconds();
        let quote = Quote {
            id: quotes.next_id,
            content,
            author,
            created_at,
            shared: false,
            likes: 0,
        };
        table::add(&mut quotes.quote_list, quotes.next_id, quote);
        quotes.next_id = quotes.next_id + 1;
    }

    public entry fun like_quote(account: &signer, quote_owner: address, quote_id: u64) acquires Quotes {
        let liker_address = signer::address_of(account);
        
        assert!(liker_address != quote_owner, E_CANNOT_LIKE_OWN_QUOTE);

        let quotes = borrow_global_mut<Quotes>(quote_owner);

        assert!(table::contains(&quotes.quote_list, quote_id), E_QUOTE_DOES_NOT_EXIST);

        if (!table::contains(&quotes.likes, quote_id)) {
            table::add(&mut quotes.likes, quote_id, table::new());
        };

        let quote_likes = table::borrow_mut(&mut quotes.likes, quote_id);

        assert!(!table::contains(quote_likes, liker_address), E_ALREADY_LIKED);

        table::add(quote_likes, liker_address, true);

        let quote = table::borrow_mut(&mut quotes.quote_list, quote_id);
        quote.likes = quote.likes + 1;
    }

    #[view]
    public fun get_quotes(address: address): vector<Quote> acquires Quotes {
        assert!(exists<Quotes>(address), 0);
        let quotes = borrow_global<Quotes>(address);
        let result = vector::empty<Quote>();
        let i = 0;
        while (i < quotes.next_id) {
            if (table::contains(&quotes.quote_list, i)) {
                let quote = table::borrow(&quotes.quote_list, i);
                vector::push_back(&mut result, *quote);
            };
            i = i + 1;
        };
        result
    }

    #[view]
    public fun get_quote_by_id(address: address, quote_id: u64): Quote acquires Quotes {
        assert!(exists<Quotes>(address), 0);
        let quotes = borrow_global<Quotes>(address);
        assert!(table::contains(&quotes.quote_list, quote_id), E_QUOTE_DOES_NOT_EXIST);
        *table::borrow(&quotes.quote_list, quote_id)
    }
}