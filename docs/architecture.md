# System Architecture

## High-level

```mermaid
flowchart LR
    Phone[React Native Expo App<br/>iOS / Android]

    subgraph Render
      API[Express REST API<br/>Node.js 18]
    end

    subgraph Atlas
      Mongo[(MongoDB<br/>9 collections)]
    end

    Cloud[Cloudinary CDN<br/>images + videos]
    Stripe[Stripe Payment Intents]

    Phone -- "1. JSON / multipart<br/>JWT Bearer" --> API
    API -- "2. CRUD" --> Mongo
    API -- "3. multer-storage-cloudinary<br/>(article cover, listing photos/video)" --> Cloud
    Phone -- "4. CardField → paymentMethod.id" --> Stripe
    Phone -- "5. POST /api/payments<br/>{ source, sourceId, paymentMethodId }" --> API
    API -- "6. paymentIntents.create + confirm" --> Stripe
    Stripe -- "7. succeeded" --> API
    API -- "8. finalizeSale: order + stock − + close listing/bid<br/>+ reject sibling offers" --> Mongo
```

## Auth flow

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Mongo

    App->>API: POST /api/auth/login {email, password}
    API->>Mongo: findOne({email})
    Mongo-->>API: user record
    API->>API: bcrypt.compare(password, user.passwordHash)
    API-->>App: { token, user }  (JWT signed with id+role)
    App->>App: AsyncStorage.setItem('gm_token', token)

    Note over App,API: Subsequent requests
    App->>API: GET /api/orders<br/>Authorization: Bearer <jwt>
    API->>API: jwt.verify → req.user = User.findById(decoded.id)
    API->>Mongo: Order.find({customer: req.user._id})
    API-->>App: [orders…]
```

## Sale finalisation (the choke point)

After a successful Stripe charge, *every* sale path funnels through `utils/finalizeSale.js`:

```mermaid
flowchart TD
    Pay[Stripe paymentIntent.status === 'succeeded']
    Pay --> Save[Save Payment doc]
    Save --> Branch{source}
    Branch -- direct --> L[Listing.status = sold<br/>reject all pending offers]
    Branch -- offer --> O[Offer must be 'accepted' & belong to user<br/>Listing.status = sold<br/>reject sibling pending offers]
    Branch -- bid --> B[Bid must be 'closed' & user is winner]
    L --> Stock
    O --> Stock
    B --> Stock
    Stock[Gem.stockQty − 1<br/>auto isAvailable=false at 0]
    Stock --> Order[Create Order with orderNumber<br/>status=Confirmed]
```

Implementation: [`backend/utils/finalizeSale.js`](../backend/utils/finalizeSale.js).

## Bid lazy-close

The auction system has no cron job. Instead, **every** `GET /api/bids` and `GET /api/bids/:id` calls [`backend/utils/lazyCloseBids.js`](../backend/utils/lazyCloseBids.js) first, which sweeps any bid where `endTime < now && status === 'active'`, sets `status = 'closed'`, and assigns `winner = currentHighest.customer`. The next time the winner opens the bid detail screen, they see the "You won" banner and a button to pay.

Trade-off: a bid that nobody views after expiry stays `active` in the DB until *someone* lists or opens any bid. Acceptable for this academic project; a Render cron job would be the production fix.

## Module dependency map

```mermaid
flowchart TD
    Auth --> Inventory
    Auth --> Learning
    Inventory --> Marketplace
    Inventory --> Bidding
    Marketplace --> Offers
    Marketplace --> Payment
    Offers --> Payment
    Bidding --> Payment
    Payment --> Orders
    Orders --> Reviews
```

This map dictates the build order in `~/.claude/plans/so-the-things-is-sprightly-newt.md`.
