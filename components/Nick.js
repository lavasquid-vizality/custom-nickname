import React, { memo } from 'react';
import getNick from '../api/getNick';

export const Nick = memo(({ original, guildId, userId, height, mention, display = 'inline-flex' }) => {
  const newNick = getNick(guildId, userId, height, mention);

  if (newNick) return <div style={{ display }}>{newNick}</div>;
  return original;
});
