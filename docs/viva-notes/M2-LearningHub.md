# M2 — Learning Hub (Article) Module

## Your responsibility
Admin publishes articles in 4 fixed categories with a Cloudinary-hosted cover image; customers browse and filter. This is the **first module that exercises the image upload pipeline** that M6 owns.

## Files you own
- [backend/models/Article.js](../../backend/models/Article.js)
- [backend/controllers/learningController.js](../../backend/controllers/learningController.js)
- [backend/routes/learning.js](../../backend/routes/learning.js)
- [mobile/src/screens/learning/LearningScreen.js](../../mobile/src/screens/learning/LearningScreen.js) (customer)
- [mobile/src/screens/learning/ArticleDetailScreen.js](../../mobile/src/screens/learning/ArticleDetailScreen.js)
- [mobile/src/screens/learning/AdminArticlesScreen.js](../../mobile/src/screens/learning/AdminArticlesScreen.js)
- [mobile/src/screens/learning/ArticleFormScreen.js](../../mobile/src/screens/learning/ArticleFormScreen.js)

Shared with M6: `backend/middleware/upload.js` and `backend/config/cloudinary.js`.

## Schema
```
{ title, category, body, coverImageUrl, coverImagePublicId, publishedAt }
category ∈ { 'Gem Types', 'Buying Guide', 'Grading & Quality', 'Care & Maintenance' }
```
Validated on **both** frontend (chip selector limits choices) and backend (Mongoose enum + controller check) — the brief asks for this dual validation.

## Endpoints
```
GET    /api/learning/categories    public  → enum values
GET    /api/learning?category=…    public  → list (optional filter)
GET    /api/learning/:id           public
POST   /api/learning               admin · multipart  fields: title, category, body, cover
PUT    /api/learning/:id           admin · multipart  (cover optional)
DELETE /api/learning/:id           admin
```

## Image upload flow
```mermaid
sequenceDiagram
    participant App
    participant API as Express
    participant CL as Cloudinary

    App->>App: ImagePicker.launchImageLibraryAsync
    App->>App: build FormData with cover (uri, type, name)
    App->>API: POST /api/learning (multipart)
    API->>API: middleware/auth → adminOnly → articleCoverUpload (multer)
    API->>CL: stream file to gemmarket/articles folder
    CL-->>API: secure_url + public_id
    API->>API: req.file.path = secure_url; req.file.filename = public_id
    API->>API: Article.create({…, coverImageUrl, coverImagePublicId})
    API-->>App: 201 article
```

The Multer instance lives in [middleware/upload.js](../../backend/middleware/upload.js); it uses [`multer-storage-cloudinary`](https://www.npmjs.com/package/multer-storage-cloudinary) so files never touch the Render filesystem.

## Integration with other modules
- **Marketplace cross-link:** when a customer reads an article in category **`Gem Types`**, the article detail screen shows a **View Related Gems** button that navigates to the Marketplace tab with the article title pre-loaded as the search term. Implementation: `ArticleDetailScreen` calls `navigation.navigate('Home', { screen: 'Market', params: { presetSearch: article.title } })`. No backend changes needed — it's pure frontend wiring.

## Likely viva questions

**Q: Why store both `coverImageUrl` and `coverImagePublicId`?**
A: The URL is what the mobile app displays. The public ID is what we'd send to Cloudinary if we ever needed to delete the asset (`cloudinary.uploader.destroy(public_id)`). Storing both means we keep the option open without an extra round-trip.

**Q: How does `multer-storage-cloudinary` know which folder?**
A: `makeStorage('articles', 'image')` in [config/cloudinary.js](../../backend/config/cloudinary.js) builds a `CloudinaryStorage` with `folder: 'gemmarket/articles'`, so every article cover lands under that path in the Cloudinary console.

**Q: What stops a customer from POSTing an article?**
A: The route is wrapped in `auth, adminOnly, articleCoverUpload` — the order matters. `auth` runs first and 401s without a token; `adminOnly` 403s a customer; only then does Multer accept the file. If you reversed the order, an unauthenticated user could still upload to Cloudinary before being rejected — a bandwidth abuse vector.

**Q: Why are categories a closed enum instead of free-text?**
A: The brief defined a fixed list. Closed enums let the customer browse via chip filters with no risk of typos creating "ghost" categories. Backend enforces it with Mongoose `enum`, frontend renders chips fetched from `GET /api/learning/categories`.

## How to demo
1. As admin, Articles tab → + Add → fill in title "Buying Sapphires", choose Buying Guide, write body, pick a cover image.
2. Submit → see it in the list with thumbnail.
3. Switch to customer → Learn tab → tap chip "Buying Guide" → article appears.
4. Open it — image loads from `res.cloudinary.com`. Body renders.
