import { Text } from 'react-native';
import { useEffect, useState } from 'react';
import { colors } from '../theme';

function format(ms) {
  if (ms <= 0) return 'Ended';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

export default function CountdownTimer({ endTime, style }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = new Date(endTime).getTime() - now;
  const ending = remaining > 0 && remaining < 60 * 60 * 1000;
  return (
    <Text
      style={[
        {
          color: remaining <= 0 ? colors.danger : ending ? colors.warn : colors.primary,
          fontWeight: '700',
          fontSize: 14,
        },
        style,
      ]}
    >
      {format(remaining)}
    </Text>
  );
}
