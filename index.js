import { Plugin } from '@vizality/entities';
import { patch, unpatchAll } from '@vizality/patcher';
import { getModule } from '@vizality/webpack';

import getNick from './api/getNick';

export default class extends Plugin {
  start () {
    this.patch();
  }

  patch () {
    // Message Username
    patch(getModule(m => String(m?.default).includes('var t=e.message,n=e.compact,r=void')), 'default', (args, res) => {
      const guildId = document.getElementsByTagName('html')[0].getAttribute('vz-guild-id');
      const userId = args[0].message.author.id;

      const Nick = getNick(guildId, userId, 21);
      if (Nick) args[0].author.nick += ` (${userId})`;
    }, 'before');
    patch(getModule(m => m?.displayName === 'Clickable').prototype, 'renderInner', (args, res) => {
      const guildId = document.getElementsByTagName('html')[0].getAttribute('vz-guild-id');

      if (res.type === 'span' && typeof res.props.children === 'string') {
        const userId = res.props.children.match(/\(([0-9]+)\)/)?.[1];
        res.props.children = getNick(guildId, userId, 21) ?? res.props.children;
      }

      return res;
    });

    // Mention
    patch(getModule(m => m?.default?.displayName === 'UserMention'), 'default', (args, res) => {
      const guildId = document.getElementsByTagName('html')[0].getAttribute('vz-guild-id');
      const { userId } = args[0];

      const _children = res.props.children;
      const roleColorSettingsGet = vizality.manager.plugins.get('role-colors').settings.get;
      if (roleColorSettingsGet('mentioncolor-icons', false) && roleColorSettingsGet('mentioncolor-@', false)) {
        res.props.children = (e) => {
          const children = _children(e);
          children.props.children.props.children[1] = getNick(guildId, userId, 21, false) ?? children.props.children.props.children[1];
          return children;
        };
      } else {
        res.props.children = (e) => {
          const children = _children(e);
          children.props.children = getNick(guildId, userId, 21, true) ?? children.props.children;
          return children;
        };
      }

      return res;
    });

    // User Popout Nickname
    patch(getModule(m => m?.default?.displayName === 'UserPopoutInfo'), 'default', (args, res) => {
      const guildId = document.getElementsByTagName('html')[0].getAttribute('vz-guild-id');
      const userId = args[0].user.id;

      args[0].nickname = getNick(guildId, userId, 24) ?? args[0].nickname;
    }, 'before');

    // Member List
    patch(getModule(m => m?.displayName === 'MemberListItem').prototype, 'render', (args, res) => {
      const name = res.props.name?.props.children;
      if (!name) return res;

      const guildId = document.getElementsByTagName('html')[0].getAttribute('vz-guild-id');
      const userId = res.props['vz-user-id'];

      res.props.name.props.children = getNick(guildId, userId, 20) ?? res.props.name.props.children;
    });
  }

  stop () {
    unpatchAll();
  }
}
