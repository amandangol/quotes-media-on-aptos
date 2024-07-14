module 0x62d96c7a6d1a927fa30a811c68f950eb021331aeca380a4c9a53c6e41b6575de::Quotes {
    use std::signer;
    use std::string::String;
    use aptos_std::table::{Self, Table};
    use aptos_framework::timestamp;
    use std::vector;

    const E_QUOTE_DOES_NOT_EXIST: u64 = 101;
    const E_ALREADY_LIKED: u64 = 103;

    struct Quote has store, drop, copy {
        id: u64,
        content: String,
        author: String,
        created_at: u64,
        shared: bool,
        likes: u64,
        owner: address,
    }

     struct Quotes has key {
        quote_list: Table<u64, Quote>,
        next_id: u64,
        likes: Table<u64, Table<address, bool>>,
    }


    struct GlobalQuotes has key {
        quotes: vector<Quote>,
    }

    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        if (!exists<Quotes>(account_addr)) {
            let quotes = Quotes {
                quote_list: table::new(),
                next_id: 0,
                likes: table::new(),
            };
            move_to(account, quotes);
        };

        if (!exists<GlobalQuotes>(account_addr)) {
            move_to(account, GlobalQuotes { quotes: vector::empty() });
        };
    }

   public entry fun add_quote(account: &signer, content: String, author: String) acquires Quotes, GlobalQuotes {
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
        owner: address,
    };
    table::add(&mut quotes.quote_list, quotes.next_id, quote);
    quotes.next_id = quotes.next_id + 1;

    // Add to global quotes
    assert!(exists<GlobalQuotes>(address), 1);
    let global_quotes = borrow_global_mut<GlobalQuotes>(address);
    vector::push_back(&mut global_quotes.quotes, quote);

    // Debug print
    debug::print(&quote);
    debug::print(&global_quotes.quotes);
}

    public entry fun share_quote(account: &signer, quote_id: u64) acquires Quotes, GlobalQuotes {
    let address = signer::address_of(account);
    assert!(exists<Quotes>(address), 0);

    let quotes = borrow_global_mut<Quotes>(address);
    assert!(table::contains(&quotes.quote_list, quote_id), E_QUOTE_DOES_NOT_EXIST);

    let quote = table::borrow_mut(&mut quotes.quote_list, quote_id);
    quote.shared = true;

    // Update global quotes
    assert!(exists<GlobalQuotes>(address), 1);
    let global_quotes = borrow_global_mut<GlobalQuotes>(address);
    let i = 0;
    let len = vector::length(&global_quotes.quotes);
    while (i < len) {
        let global_quote = vector::borrow_mut(&mut global_quotes.quotes, i);
        if (global_quote.id == quote_id && global_quote.owner == address) {
            global_quote.shared = true;
            break
        };
        i = i + 1;
    };
}

    public entry fun like_quote(account: &signer, quote_owner: address, quote_id: u64) acquires Quotes, GlobalQuotes {
        let liker_address = signer::address_of(account);
        
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

        // Update global quotes
        assert!(exists<GlobalQuotes>(quote_owner), 1);
        let global_quotes = borrow_global_mut<GlobalQuotes>(quote_owner);
        let i = 0;
        let len = vector::length(&global_quotes.quotes);
        while (i < len) {
            let global_quote = vector::borrow_mut(&mut global_quotes.quotes, i);
            if (global_quote.id == quote_id && global_quote.owner == quote_owner) {
                global_quote.likes = global_quote.likes + 1;
                break
            };
            i = i + 1;
        };
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

    use std::debug;

#[view]
public fun get_all_quotes(address: address): vector<Quote> acquires GlobalQuotes {
    assert!(exists<GlobalQuotes>(address), 1);
    let global_quotes = borrow_global<GlobalQuotes>(address);
    *&global_quotes.quotes
}

   #[view]
    public fun get_quote_by_id(address: address, quote_id: u64): Quote acquires Quotes {
        assert!(exists<Quotes>(address), 0);
        let quotes = borrow_global<Quotes>(address);
        assert!(table::contains(&quotes.quote_list, quote_id), E_QUOTE_DOES_NOT_EXIST);
        *table::borrow(&quotes.quote_list, quote_id)
    }
}
