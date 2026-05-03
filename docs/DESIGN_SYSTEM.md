# GemMarket Design System

A small, opinionated set of tokens + components shared across all 30+ screens. Light theme on white, royal-purple primary, amber accent. Animations powered by [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) v4.

---

## 1 · Tokens — [mobile/src/theme.js](../mobile/src/theme.js)

### Colors

| Token | Hex | Use |
|---|---|---|
| `bg` | `#FFFFFF` | screen background |
| `surface` | `#FAFAFE` | input + subtle surfaces |
| `surfaceAlt` | `#F3F0FF` | soft lilac (chips, hero stats) |
| `surfaceMuted` | `#F4F4F5` | placeholders, skeleton |
| `text` | `#0F172A` | primary text (slate-900) |
| `textDim` | `#64748B` | secondary text (slate-500) |
| `textMuted` | `#94A3B8` | tertiary text |
| `primary` | `#6D28D9` | violet-700 — buttons, links, accents |
| `primaryDark` | `#5B21B6` | hover/pressed |
| `primaryLight` | `#8B5CF6` | hero gradient end |
| `primaryGlow` | `rgba(109,40,217,.12)` | active tab background |
| `accent` | `#F59E0B` | amber-500 — prices, ratings, highlights |
| `success` | `#10B981` | order delivered, accepted offer |
| `warn` | `#F97316` | processing, pending |
| `danger` | `#EF4444` | delete, errors, cancelled |
| `info` | `#2563EB` | informational badge |
| `border` | `#E5E7EB` | hairlines on cards/inputs |
| `divider` | `#F3F4F6` | inside-card separators |
| `gradStart` / `gradEnd` | `#7C3AED` / `#A855F7` | GradientButton |
| `heroStart` / `heroEnd` | `#6D28D9` / `#9333EA` | Hero component |

### Spacing

`spacing(n) = n * 8` — multiples of 8 keeps rhythm consistent. Use `spacing(2)` for snug, `spacing(3)` for default card padding, `spacing(5)` for hero copy.

### Radii

| Token | Px | Use |
|---|---|---|
| `sm` | 8 | small buttons, chips |
| `md` | 12 | inputs, default buttons |
| `lg` | 16 | cards |
| `xl` | 24 | hero, modal sheets |
| `pill` | 999 | badges, chips |

### Shadows

| Token | When |
|---|---|
| `sm` | normal cards (1px lift) |
| `md` | toasts, elevated cards |
| `lg` | overlays, modal sheets |
| `glow` | primary buttons + Hero (purple-tinted) |

### Typography

| Token | Size | Weight | Use |
|---|---|---|---|
| `display` | 32 | 800 | screen titles |
| `h1` | 26 | 800 | gem names, big headers |
| `h2` | 20 | 700 | section headers |
| `h3` | 17 | 700 | sub-headers, menu labels |
| `body` | 15 | 400 | normal text |
| `bodyStrong` | 15 | 600 | emphasized body |
| `caption` | 13 | 500 | secondary copy |
| `micro` | 11 | 600 | uppercase eyebrows, badges |

### Motion

| Token | ms |
|---|---|
| `fast` | 180 — toggles, taps |
| `base` | 260 — default screen entries |
| `slow` | 420 — hero / first-paint |
| `stagger` | 60 — between list items |

### Helpers

`formatPrice(n)` → `"$4,250"` (thousands separator, no decimals)

---

## 2 · Components — [mobile/src/components/](../mobile/src/components/)

### Surfaces
| Component | Purpose | Notes |
|---|---|---|
| `Screen` | top-level wrapper with safe-area + scroll + pull-to-refresh | always white background |
| `Card` | container with border, radius, optional press animation | `onPress` makes it tappable with scale-on-press |
| `Hero` | gradient hero with sparkle accents + Reanimated FadeIn | used on Home + SellerProfile |

### Inputs
| Component | Purpose |
|---|---|
| `Input` | label + box + left icon + error/hint, focus border = primary |
| `Button` | filled / outline / ghost / secondary / danger / subtle, springs on press |
| `GradientButton` | primary CTA with purple gradient + glow shadow |

### Indicators
| Component | Purpose |
|---|---|
| `Badge` | small pill (primary/accent/success/warn/danger/info/neutral) |
| `RatingBadge` | ★ rating + count, used on listings + atelier |
| `Chip` | filterable pill — categories, gem pickers |
| `StatusTracker` | 4-step horizontal progress for orders |
| `CountdownTimer` | live-ticking countdown for bids |
| `Skeleton` / `SkeletonCard` | shimmer placeholder while loading |
| `EmptyState` | icon + title + message + optional action |
| `StarRating` | tap-to-set or readonly |

### Feedback
| Component | Purpose |
|---|---|
| `Toast` | top-anchored snackbars (success/error/warn/info), 2.8s auto-dismiss |
| `Confetti` | particle burst on payment success |
| `AnimatedListItem` | wraps any item with FadeInDown + stagger by index |

### Internal helpers
| Helper | Purpose |
|---|---|
| `useToast()` | hook returning `.success` / `.error` / `.warn` / `.info` / `.show` |
| `useAuth()` | user + token + login/register/logout — backed by AsyncStorage |

---

## 3 · Animation patterns

| Pattern | Where | Implementation |
|---|---|---|
| Press scale | every Button & GradientButton & Card with onPress | `useSharedValue(1)` → `withSpring(.96)` |
| List entries | every FlatList renderItem | `<AnimatedListItem index={i}>` → `FadeInDown.springify().damping(18)` |
| Screen entries | major content blocks | `Animated.View entering={FadeInDown.delay(N).duration(420)}` |
| Hero parallax | GemDetail + ArticleDetail | `useAnimatedScrollHandler` + `interpolate(scrollY, [-200,0,HERO_H], [-100,0,HERO_H*0.4])` |
| Toast appear | Toast container | `entering={FadeInDown.springify().damping(18)} exiting={FadeOutUp.duration(180)}` |
| Skeleton shimmer | Skeleton | `withRepeat(withTiming(1, 900ms))` opacity 0.4↔1 |
| Confetti | PaymentScreen success | 60 pieces × random delay/x/colour, fall + rotate over 2.4s |
| Haptics | every meaningful tap (native only, web silent) | `Haptics.impactAsync(Light)` on Buttons, `Medium` on GradientButton, `selectionAsync` on StarRating |

Reanimated requires `react-native-worklets/plugin` in [babel.config.js](../mobile/babel.config.js) — already wired.

---

## 4 · Layout grid

Most screens follow this structure:

```jsx
<Screen padded={false}>
  <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
    <Text style={type.display}>Title</Text>
    <Text style={[type.body, { color: colors.textDim }]}>Subtitle</Text>
  </View>

  <FlatList
    contentContainerStyle={{ padding: 20, paddingTop: 8 }}
    renderItem={({ item, index }) => (
      <AnimatedListItem index={index}>
        <Card onPress={...}>...</Card>
      </AnimatedListItem>
    )}
    ListEmptyComponent={<EmptyState icon="..." title="..." message="..." />}
  />
</Screen>
```

For form screens:
```jsx
<Screen scroll>
  <Animated.View entering={FadeInDown.duration(360)}>
    <Text style={type.display}>Title</Text>
    <Input label="..." />
    ...
    <GradientButton title="Submit" icon="✦" onPress={submit} loading={loading} />
  </Animated.View>
</Screen>
```

## 5 · How to extend

When you add a new screen:
1. Import only from `'../theme'` and `'../components/...'` — never write raw `#hex` colors
2. Wrap list items in `<AnimatedListItem index={i}>` for the staggered entry
3. Use `useToast()` instead of `Alert.alert`
4. Use `<EmptyState>` for empty results, `<SkeletonCard>` for initial loading
5. Major sections get their own `Animated.View entering={FadeInDown.delay(...)}`
6. Primary CTAs use `<GradientButton>`, secondary use `<Button variant="outline">`
