import React from 'react';
import { Plugin } from '@vizality/entities';
import { Events } from '@vizality/constants';
import { patch, unpatchAll } from '@vizality/patcher';
import { getModule } from '@vizality/webpack';
import { sleep } from '@vizality/util/time';

import getNick from './api/getNick';
import { Nick } from './components/Nick';

const { getGuildId } = getModule('getGuildId', 'getLastSelectedGuildId');

export default class extends Plugin {
  start () {
    vizality.manager.plugins.once(Events.VIZALITY_ADDONS_READY, this.patch);
    sleep(1000).then(() => {
      if (vizality.manager.plugins.listeners(Events.VIZALITY_ADDONS_READY).includes(this.patch)) {
        vizality.manager.plugins.off(Events.VIZALITY_ADDONS_READY, this.patch);
        this.patch();
      }
    });
  }

  patch () {
    // Message Username
    patch(getModule(m => String(m?.default).includes('var t=e.message,n=e.compact,r=void')), 'default', (args, res) => {
      const userId = args[0].message.author.id;

      if (args[0].author.nick.includes(` (${userId})`)) return;

      const Nick = getNick(getGuildId(), userId, 21);
      if (Nick) args[0].author.nick += ` (${userId})`;
    }, 'before');
    patch(getModule(m => m?.displayName === 'Clickable').prototype, 'renderInner', (args, res) => {
      if (res.type === 'span' && typeof res.props.children === 'string') {
        const userId = res.props.children.match(/\(([0-9]+)\)/)?.[1];
        res.props.children = <Nick original={res.props.children} guildId={getGuildId()} userId={userId} height={21} />;
      }

      return res;
    });

    // Mention
    patch(getModule(m => m?.default?.displayName === 'UserMention'), 'default', (args, res) => {
      const { userId } = args[0];

      const _children = res.props.children;

      res.props.children = (e) => {
        const children = _children(e);
        if (children.props.children.props?.children[1]) {
          children.props.children.props.children[1] = <Nick original={children.props.children.props.children[1]} guildId={getGuildId()} userId={userId} height={21} mention={false} />;
        } else if (children.props.children) {
          children.props.children = <Nick original={children.props.children} guildId={getGuildId()} userId={userId} height={21} mention={true} />;
        }
        return children;
      };

      return res;
    });

    // User Popout Nickname
    patch(getModule(m => m?.default?.displayName === 'UserPopoutInfo'), 'default', (args, res) => {
      args[0].nickname = <Nick original={args[0].nickname} guildId={getGuildId()} userId={args[0].user.id} height={24} />;
    }, 'before');

    // Member List
    patch(getModule(m => m?.displayName === 'MemberListItem').prototype, 'render', (args, res) => {
      const name = res.props.name?.props.children;
      const nameST = res.props.name?.props.children.props?.text;
      if (!name) return res;

      if (nameST) {
        res.props.name.props.children.props.text = <Nick original={nameST} guildId={getGuildId()} userId={res.props['vz-user-id']} height={21} display={'inline'} />;
        res.props.name.props.children.props.tooltipText = <Nick original={nameST} guildId={getGuildId()} userId={res.props['vz-user-id']} height={18} />;
      } else if (name) res.props.name.props.children = <Nick original={name} guildId={getGuildId()} userId={res.props['vz-user-id']} height={21} />;

      return res;
    });

    // Private Channels
    patch(getModule(m => m?.displayName === 'PrivateChannel').prototype, 'render', (args, res) => {
      const name = res.props.name.props.children;
      const namePI = res.props.name.props.children[0].props?.children;

      if (namePI) res.props.name.props.children[0].props.children = <Nick original={namePI} guildId={getGuildId()} userId={res.props['vz-user-id']} height={20} />;
      else if (name) res.props.name.props.children = <Nick original={name} guildId={getGuildId()} userId={res.props['vz-user-id']} height={20} />;

      return res;
    });
    patch(getModule(m => m?.default?.displayName === 'EmptyMessage'), 'default', (args, res) => {
      const userId = args[0].children[0].props.src.match(/\/([0-9]+)\//)[1];
      const headerName = args[0].children[1].props.children;
      const name = args[0].children[2].props.children[0][1];

      args[0].children[1].props.children = <Nick original={headerName} guildId={getGuildId()} userId={userId} height={40} />;
      args[0].children[2].props.children[0][1] = <Nick original={name} guildId={getGuildId()} userId={userId} height={20} mention={true} />;
    }, 'before');
  }

  stop () {
    unpatchAll();
  }
}
