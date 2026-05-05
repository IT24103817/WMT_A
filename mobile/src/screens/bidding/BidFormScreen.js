import { useState } from 'react';
import { Text, View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Input from '../../components/Input';
import GradientButton from '../../components/GradientButton';
import GemPicker from '../../components/GemPicker';
import { bids } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, radii, type } from '../../theme';

const isWeb = Platform.OS === 'web';

export default function BidFormScreen({ navigation, route }) {
  const editing = route.params?.bid || null;
  const [gem, setGem] = useState(editing?.gem || null);
  const [description, setDescription] = useState(editing?.description || '');
  const [startPrice, setStartPrice] = useState(editing?.startPrice?.toString() || '');
  const [hours, setHours] = useState(editing ? '' : '24');
  const [endIso, setEndIso] = useState(editing?.endTime ? new Date(editing.endTime).toISOString().slice(0, 16) : '');

  // 'now' = go live immediately; 'schedule' = pick a future start time
  const [scheduleMode, setScheduleMode] = useState(editing?.scheduledStartAt ? 'schedule' : 'now');
  const [scheduledIso, setScheduledIso] = useState(
    editing?.scheduledStartAt ? new Date(editing.scheduledStartAt).toISOString().slice(0, 16) : ''
  );

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async () => {
    const e = {};
    if (!editing && !gem) e.gem = 'Pick a gem';
    if (!description.trim()) e.description = 'Required';
    if (!editing && !(Number(startPrice) > 0)) e.startPrice = 'Required';

    let endTime;
    if (editing) {
      // editing path uses the explicit end ISO
      if (!endIso) {
        e.endTime = 'Pick an end time';
      } else {
        const e1 = new Date(endIso);
        if (Number.isNaN(e1.getTime()) || e1 <= new Date()) e.endTime = 'Must be in the future';
        else endTime = e1;
      }
    } else {
      const h = Number(hours);
      if (!(h > 0)) e.hours = 'Hours > 0';
      else endTime = new Date(Date.now() + h * 3600 * 1000);
    }

    let scheduledStartAt = null;
    if (scheduleMode === 'schedule') {
      if (!scheduledIso) e.schedule = 'Pick a start date';
      else {
        const s = new Date(scheduledIso);
        if (Number.isNaN(s.getTime())) e.schedule = 'Invalid date';
        else if (endTime && s >= endTime) e.schedule = 'Start must be before end';
        else scheduledStartAt = s;
      }
    }

    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      setLoading(true);
      if (editing) {
        const payload = {
          description: description.trim(),
          endTime: endTime?.toISOString(),
        };
        if (scheduleMode === 'now') payload.scheduledStartAt = null;
        else if (scheduledStartAt) payload.scheduledStartAt = scheduledStartAt.toISOString();
        await bids.update(editing._id, payload);
        toast.success('Auction updated');
      } else {
        const payload = {
          gemId: gem._id,
          startPrice: Number(startPrice),
          endTime: endTime.toISOString(),
          description: description.trim(),
        };
        if (scheduledStartAt) payload.scheduledStartAt = scheduledStartAt.toISOString();
        await bids.create(payload);
        toast.success(scheduledStartAt ? 'Auction scheduled' : 'Auction live!');
      }
      navigation.goBack();
    } catch (err) {
      toast.error(err.userMessage || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(360)}>
        <Text style={styles.h1}>{editing ? 'Edit auction' : 'New auction'}</Text>
        <Text style={styles.sub}>
          {editing ? 'Update description, end time or start schedule.' : 'Schedule a future auction or go live now.'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(360)} style={{ marginTop: 24 }}>
        {!editing ? (
          <>
            <GemPicker selectedGem={gem} onSelect={setGem} />
            {errors.gem ? <Text style={styles.err}>{errors.gem}</Text> : null}
          </>
        ) : (
          <View style={styles.lockedGem}>
            <Text style={styles.lockedName}>{gem?.name}</Text>
            <Text style={styles.lockedHint}>Gem cannot be changed once an auction starts</Text>
          </View>
        )}

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ minHeight: 90 }}
          placeholder="What makes this gem auction-worthy?"
          error={errors.description}
        />

        {!editing ? (
          <Input
            label="Starting price ($)"
            value={startPrice}
            onChangeText={setStartPrice}
            keyboardType="decimal-pad"
            leftIcon="$"
            error={errors.startPrice}
          />
        ) : null}

        {/* Schedule mode toggle */}
        <Text style={styles.sectionLabel}>When should it start?</Text>
        <View style={styles.modeRow}>
          <ModeOption
            label="Go live now"
            icon="⚡"
            active={scheduleMode === 'now'}
            onPress={() => setScheduleMode('now')}
          />
          <ModeOption
            label="Schedule"
            icon="🕒"
            active={scheduleMode === 'schedule'}
            onPress={() => setScheduleMode('schedule')}
          />
        </View>

        {scheduleMode === 'schedule' ? (
          <Input
            label="Start date & time"
            value={scheduledIso}
            onChangeText={setScheduledIso}
            placeholder={isWeb ? 'YYYY-MM-DDTHH:MM' : '2026-05-10T09:00'}
            hint="Format: YYYY-MM-DDTHH:MM (e.g. 2026-05-10T09:00 — local time)"
            error={errors.schedule}
          />
        ) : null}

        {!editing ? (
          <Input
            label="Duration"
            value={hours}
            onChangeText={setHours}
            keyboardType="number-pad"
            hint={scheduleMode === 'schedule' ? 'Hours from the scheduled start' : 'Hours from now'}
            error={errors.hours}
          />
        ) : (
          <Input
            label="End date & time"
            value={endIso}
            onChangeText={setEndIso}
            placeholder="2026-05-11T09:00"
            hint="Format: YYYY-MM-DDTHH:MM"
            error={errors.endTime}
          />
        )}

        <GradientButton
          title={editing ? 'Save changes' : (scheduleMode === 'schedule' ? 'Schedule auction' : 'Start auction now')}
          icon={scheduleMode === 'schedule' ? '🕒' : '🔨'}
          onPress={submit}
          loading={loading}
        />
      </Animated.View>
    </Screen>
  );
}

function ModeOption({ label, icon, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.mode, active ? styles.modeActive : styles.modeInactive]}
    >
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[styles.modeLabel, active && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, color: colors.text, fontSize: 28 },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 6 },
  err: { color: colors.danger, fontSize: 12, marginBottom: 8 },
  sectionLabel: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  mode: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 12,
    borderRadius: radii.md, borderWidth: 1, gap: 6,
  },
  modeInactive: { backgroundColor: colors.bg, borderColor: colors.border },
  modeActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  modeLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  lockedGem: {
    backgroundColor: colors.surfaceAlt, borderRadius: radii.md, padding: 14, marginBottom: 16,
  },
  lockedName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  lockedHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
