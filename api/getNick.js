import React from 'react';
import Database from '../database.json';

export default (guildId, userId, height, mention = false) => {
  if (userId) {
    let nick;
    if (Database.global[userId]) {
      nick = Database.global[userId];
    } else if (Database[guildId]?.[userId]) {
      nick = Database[guildId][userId];
    }


    if (nick) {
      const emojis = nick.match(/<a?:[a-zA-Z]+:[0-9]+>/g);

      const newNick = [];
      for (const emoji of emojis) {
        if (!nick.startsWith('<')) newNick.push(nick.slice(0, nick.indexOf(emoji))); nick = nick.replace(nick.slice(0, nick.indexOf(emoji)), '');
        newNick.push(<img height={height} style={{ marginLeft: '1px', marginRight: '1px' }} src={`https://cdn.discordapp.com/emojis/${emoji.match(/:([0-9]+)>/)[1]}.${emoji.startsWith('<a:') ? 'gif' : 'png'}?v=1`} />);
        nick = nick.replace(emoji, '');
      }
      if (nick) newNick.push(nick); nick.replace(nick, '');
      if (mention) newNick.unshift('@');

      return newNick;
    }
  }
};
