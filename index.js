import { Plugin } from '@vizality/entities';
import { patch, unpatchAll } from '@vizality/patcher';
import { getModule } from '@vizality/webpack';
import { sleep } from '@vizality/util/Time';

import getNick from './api/getNick';

const { getGuildId } = getModule('getGuildId', 'getLastSelectedGuildId');

export default class extends Plugin {
  async start () {
    await sleep(1000);
    this.patch();
  }

  patch () {
    // Message Username
    patch(getModule(m => String(m?.default).includes('var t=e.message,n=e.compact,r=void')), 'default', (args, res) => {
      const userId = args[0].message.author.id;

      const Nick = getNick(getGuildId(), userId, 21);
      if (Nick) args[0].author.nick += ` (${userId})`;
    }, 'before');
    patch(getModule(m => m?.displayName === 'Clickable').prototype, 'renderInner', (args, res) => {
      if (res.type === 'span' && typeof res.props.children === 'string') {
        const userId = res.props.children.match(/\(([0-9]+)\)/)?.[1];
        res.props.children = getNick(getGuildId(), userId, 21) ?? res.props.children;
      }

      return res;
    });

    // Mention
    patch(getModule(m => m?.default?.displayName === 'UserMention'), 'default', (args, res) => {
      const guildId = getGuildId();
      const { userId } = args[0];

      const _children = res.props.children;

      res.props.children = (e) => {
        const children = _children(e);
        if (children.props.children.props?.children[1]) {
          children.props.children.props.children[1] = getNick(guildId, userId, 21, false) ?? children.props.children.props.children[1];
        } else if (children.props.children) {
          children.props.children = getNick(guildId, userId, 21, true) ?? children.props.children;
        }
        return children;
      };

      return res;
    });

    // User Popout Nickname
    patch(getModule(m => m?.default?.displayName === 'UserPopoutInfo'), 'default', (args, res) => {
      args[0].nickname = getNick(getGuildId(), args[0].user.id, 24) ?? args[0].nickname;
    }, 'before');

    // Member List
    patch(getModule(m => m?.displayName === 'MemberListItem').prototype, 'render', (args, res) => {
      const name = res.props.name?.props.children;
      if (!name) return res;

      res.props.name.props.children = getNick(getGuildId(), res.props['vz-user-id'], 20) ?? res.props.name.props.children;
    });
  }

  stop () {
    unpatchAll();
  }
}
