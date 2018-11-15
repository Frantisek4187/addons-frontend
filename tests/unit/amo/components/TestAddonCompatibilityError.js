import { oneLine } from 'common-tags';
import * as React from 'react';

import AddonCompatibilityError, {
  AddonCompatibilityErrorBase,
} from 'amo/components/AddonCompatibilityError';
import { DOWNLOAD_FIREFOX_URL } from 'amo/constants';
import { makeQueryStringWithUTM } from 'amo/utils';
import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NON_RESTARTLESS_ADDON,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { loadVersions } from 'core/reducers/versions';
import Notice from 'ui/components/Notice';
import {
  createFakeClientCompatibility,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakeVersion,
  getFakeLogger,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    // Set up an empty store and let each test call
    // dispatchClientMetadata().
    store = dispatchClientMetadata().store;
  });

  const _dispatchClientMetadata = (params = {}) => {
    return dispatchClientMetadata({
      store,
      userAgent: userAgentsByPlatform.mac.firefox57,
      ...params,
    });
  };

  const getClientCompatibilityNonFirefox = sinon.stub().returns(
    createFakeClientCompatibility({
      downloadUrl: DOWNLOAD_FIREFOX_URL,
      reason: INCOMPATIBLE_NOT_FIREFOX,
    }),
  );

  const _loadVersions = (versionProps = {}) => {
    store.dispatch(
      loadVersions({
        slug: fakeAddon.slug,
        versions: [
          {
            ...fakeVersion,
            ...versionProps,
          },
        ],
      }),
    );
  };

  const render = ({ ...props }) => {
    const defaultProps = {
      addon: createInternalAddon(fakeAddon),
      i18n: fakeI18n(),
      store,
    };

    return shallowUntilTarget(
      <AddonCompatibilityError {...defaultProps} {...props} />,
      AddonCompatibilityErrorBase,
    );
  };

  const renderWithVersion = (props = {}) => {
    _loadVersions();
    return render(props);
  };

  it('renders nothing if there is no addon', () => {
    const root = render({ addon: null });

    expect(root.find('.AddonCompatibilityError')).toHaveLength(0);
  });

  it('renders nothing if there is no currentVersion', () => {
    const root = render();

    expect(root.find('.AddonCompatibilityError')).toHaveLength(0);
  });

  it('renders a notice for non-Firefox browsers', () => {
    const root = renderWithVersion({
      _getClientCompatibility: getClientCompatibilityNonFirefox,
    });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .render()
        .find('a')
        .attr('href'),
    ).toEqual(
      `${DOWNLOAD_FIREFOX_URL}${makeQueryStringWithUTM({
        utm_content: 'install-addon-button',
      })}`,
    );
    expect(root.find('.AddonCompatibilityError-message').html()).toMatch(
      /You need to .*download Firefox.* to install this add-on/,
    );
  });

  it('renders a generic notice for non-Firefox browsers', () => {
    const root = renderWithVersion({
      _getClientCompatibility: getClientCompatibilityNonFirefox,
    });

    expect(root.find('.AddonCompatibilityError').find(Notice)).toHaveProp(
      'type',
      'firefox',
    );
  });

  it('renders an error notice for other reasons than non-Firefox', () => {
    const _getClientCompatibility = sinon.stub().returns(
      createFakeClientCompatibility({
        reason: INCOMPATIBLE_OVER_MAX_VERSION,
      }),
    );

    const root = renderWithVersion({ _getClientCompatibility });

    expect(root.find('.AddonCompatibilityError').find(Notice)).toHaveProp(
      'type',
      'error',
    );
  });

  it('renders a notice if add-on is over maxVersion/compat is strict', () => {
    const _getClientCompatibility = sinon.stub().returns(
      createFakeClientCompatibility({
        reason: INCOMPATIBLE_OVER_MAX_VERSION,
      }),
    );

    const root = renderWithVersion({ _getClientCompatibility });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('This add-on is not compatible with your version of Firefox');
  });

  it('renders a notice for old versions of Firefox', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.firefox33,
    });
    const _getClientCompatibility = sinon.stub().returns(
      createFakeClientCompatibility({
        minVersion: '34.0',
        reason: INCOMPATIBLE_UNDER_MIN_VERSION,
      }),
    );

    const root = renderWithVersion({ _getClientCompatibility });

    const text = root
      .find('.AddonCompatibilityError')
      .childAt(0)
      .html();

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .render()
        .find('a')
        .attr('href'),
    ).toMatch(new RegExp(DOWNLOAD_FIREFOX_URL));
    expect(text).toMatch(/This add-on requires a .*newer version of Firefox/);
    expect(text).toContain('(at least version 34.0)');
    expect(text).toContain('You are using Firefox 33.0');
  });

  it('renders a notice for iOS users', () => {
    const _getClientCompatibility = sinon.stub().returns(
      createFakeClientCompatibility({
        reason: INCOMPATIBLE_FIREFOX_FOR_IOS,
      }),
    );

    const root = renderWithVersion({ _getClientCompatibility });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('Firefox for iOS does not currently support add-ons.');
  });

  it('renders a notice for browsers that do not support OpenSearch', () => {
    const _getClientCompatibility = sinon.stub().returns(
      createFakeClientCompatibility({
        reason: INCOMPATIBLE_NO_OPENSEARCH,
      }),
    );

    const root = renderWithVersion({ _getClientCompatibility });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('Your version of Firefox does not support search plugins.');
  });

  it('renders a notice if add-on is incompatible with the platform', () => {
    const _getClientCompatibility = sinon.stub().returns(
      createFakeClientCompatibility({
        reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
      }),
    );

    const root = renderWithVersion({ _getClientCompatibility });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('This add-on is not available on your platform.');
  });

  it('renders a notice if add-on is non-restartless', () => {
    const _getClientCompatibility = sinon.stub().returns(
      createFakeClientCompatibility({
        reason: INCOMPATIBLE_NON_RESTARTLESS_ADDON,
      }),
    );

    const root = renderWithVersion({ _getClientCompatibility });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain(oneLine`Your version of Firefox does not support this add-on
      because it requires a restart.`);
  });

  it('renders a notice and logs warning when reason code not known', () => {
    const fakeLog = getFakeLogger();
    const reason = 'fake reason';
    const _getClientCompatibility = sinon.stub().returns(
      createFakeClientCompatibility({
        reason,
      }),
    );

    const root = renderWithVersion({ _getClientCompatibility, _log: fakeLog });

    sinon.assert.calledWith(
      fakeLog.warn,
      `Unknown reason code supplied to AddonCompatibilityError: ${reason}`,
    );
    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('Your browser does not support add-ons.');
  });
});
