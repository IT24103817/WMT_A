import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet, FlatList } from 'react-native';
import { inventory } from '../api';
import { colors, radii } from '../theme';

/**
 * Search + select from inventory. Filters as the user types across name, type and colour.
 *  - `selectedGem`     currently selected gem doc (or null)
 *  - `onSelect(gem)`   called when a row is tapped
 *  - `requireStock`    if true, hides gems with stockQty <= 0 (default true)
 *  - `excludeIds`      array of gem _ids to exclude from results
 */
export default function GemPicker({
  selectedGem,
  onSelect,
  requireStock = true,
  excludeIds = [],
  label = 'Pick a gem from inventory',
  emptyHint = 'No matching gems with stock available.',
}) {
  const [query, setQuery] = useState('');
  const [gems, setGems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    inventory.list()
      .then((all) => { if (alive) setGems(all); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gems.filter((g) => {
      if (requireStock && (g.stockQty ?? 0) <= 0) return false;
      if (excludeIds.includes(g._id)) return false;
      if (!q) return true;
      return [g.name, g.type, g.colour].filter(Boolean).some((s) => s.toLowerCase().includes(q));
    });
  }, [query, gems, requireStock, excludeIds]);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>

      {selectedGem ? (
        <Pressable onPress={() => onSelect?.(null)} style={styles.selectedCard}>
          {selectedGem.photos?.[0] ? (
            <Image source={{ uri: selectedGem.photos[0] }} style={styles.selectedThumb} />
          ) : (
            <View style={[styles.selectedThumb, styles.placeholder]}>
              <Text style={{ fontSize: 22 }}>💎</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedName}>{selectedGem.name}</Text>
            <Text style={styles.selectedMeta}>
              {selectedGem.type} · {selectedGem.colour} · {selectedGem.carats}ct
            </Text>
            <Text style={styles.changeHint}>Tap to change</Text>
          </View>
          <Text style={styles.tick}>✓</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, type or colour…"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.results}>
            {loading ? (
              <Text style={styles.empty}>Loading inventory…</Text>
            ) : filtered.length === 0 ? (
              <Text style={styles.empty}>{emptyHint}</Text>
            ) : (
              filtered.slice(0, 8).map((g) => (
                <Pressable key={g._id} onPress={() => onSelect?.(g)} style={styles.row}>
                  {g.photos?.[0] ? (
                    <Image source={{ uri: g.photos[0] }} style={styles.rowThumb} />
                  ) : (
                    <View style={[styles.rowThumb, styles.placeholder]}>
                      <Text style={{ fontSize: 18 }}>💎</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{g.name}</Text>
                    <Text style={styles.rowMeta}>
                      {g.type} · {g.colour} · {g.carats}ct
                    </Text>
                  </View>
                  <Text style={styles.rowStock}>{g.stockQty} in stock</Text>
                </Pressable>
              ))
            )}
            {!loading && filtered.length > 8 ? (
              <Text style={styles.hint}>+{filtered.length - 8} more — refine your search</Text>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textDim, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 14, color: colors.textDim, marginRight: 8 },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 12, fontSize: 15 },
  results: { marginTop: 8, gap: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
    padding: 10,
  },
  rowThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surfaceMuted },
  placeholder: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  rowStock: { color: colors.success, fontSize: 11, fontWeight: '700' },
  empty: { color: colors.textDim, fontSize: 13, padding: 12, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 12, padding: 6, textAlign: 'center' },
  selectedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1, borderColor: colors.primary, borderRadius: radii.md,
    padding: 12,
  },
  selectedThumb: { width: 56, height: 56, borderRadius: 10 },
  selectedName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  selectedMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  changeHint: { color: colors.primary, fontSize: 11, marginTop: 4, fontWeight: '700' },
  tick: { color: colors.primary, fontSize: 22, fontWeight: '900' },
});
