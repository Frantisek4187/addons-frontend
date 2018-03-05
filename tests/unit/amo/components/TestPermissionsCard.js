import * as React from 'react';

import PermissionsCard, {
  PermissionsCardBase,
} from 'amo/components/PermissionsCard';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeAddon,
  dispatchClientMetadata,
  fakeAddon,
  fakePlatformFile,
} from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import Button from 'ui/components/Button';
import Permission from 'ui/components/Permission';


describe(__filename, () => {
  const { store } = dispatchClientMetadata();
  const createAddonWithPermissions = (permissions) => {
    return createInternalAddon(createFakeAddon({
      files: [{
        ...fakePlatformFile,
        permissions,
      }],
    }));
  };

  function render(props = {}) {
    return shallowUntilTarget(
      <PermissionsCard
        addon={props.addon || createInternalAddon(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      PermissionsCardBase
    );
  }

  describe('no permissions', () => {
    it('renders nothing without an addon', () => {
      const root = render({ addon: null });
      expect(root.find('.PermissionsCard')).toHaveLength(0);
    });

    it('renders nothing for an addon with no permissions', () => {
      const addon = createAddonWithPermissions([]);
      const root = render({ addon });
      expect(root.find('.PermissionsCard')).toHaveLength(0);
    });

    it('renders nothing for an addon with no displayable permissions', () => {
      const root = render();
      expect(root.find('.PermissionsCard')).toHaveLength(0);
    });
  });

  describe('with permissions', () => {
    it('renders itself', () => {
      const permission = 'bookmarks';
      const root = render({
        addon: createAddonWithPermissions([permission]),
      });
      expect(root.find('.PermissionsCard')).toHaveLength(1);
      expect(root.find('.PermissionsCard-subhead')).toHaveLength(1);
      expect(root.find('.PermissionsCard-list')).toHaveLength(1);
      expect(root.find(Button)).toHaveProp('blackIcon', true);
      expect(root.find(Button)).toHaveProp('className', 'PermissionCard-learn-more');
      expect(root.find(Button)).toHaveProp('external', true);
      expect(root.find(Permission)).toHaveProp('className', permission);
    });
  });
});
