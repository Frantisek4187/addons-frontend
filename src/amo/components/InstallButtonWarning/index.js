/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import type { AppState } from 'amo/store';
import { UNKNOWN } from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import tracking from 'core/tracking';
import { withExperiment } from 'core/withExperiment';
import Notice from 'ui/components/Notice';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { InstalledAddon } from 'core/reducers/installations';
import type { WithExperimentInjectedProps } from 'core/withExperiment';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type CouldShowWarningParams = {|
  addonIsRecommended: boolean | void,
  experimentEnabled: $PropertyType<
    WithExperimentInjectedProps,
    'experimentEnabled',
  >,
  installStatus: $PropertyType<InstalledAddon, 'status'>,
|};

export const couldShowWarning = ({
  addonIsRecommended,
  experimentEnabled,
  installStatus,
}: CouldShowWarningParams) => {
  return !addonIsRecommended && experimentEnabled && installStatus === UNKNOWN;
};

type InternalProps = {|
  ...Props,
  ...WithExperimentInjectedProps,
  _couldShowWarning: typeof couldShowWarning,
  _log: typeof log,
  _tracking: typeof tracking,
  i18n: I18nType,
  installStatus: $PropertyType<InstalledAddon, 'status'>,
|};

export const EXPERIMENT_CATEGORY_CLICK =
  'AMO Install Button Warning Experiment - Click';
export const EXPERIMENT_CATEGORY_SHOW =
  'AMO Install Button Warning Experiment - Display';
export const EXPERIMENT_ID = 'installButtonWarning';
export const INSTALL_WARNING_EXPERIMENT_DIMENSION = 'dimension6';
export const VARIANT_INCLUDE_WARNING = 'includeWarning';
export const VARIANT_EXCLUDE_WARNING = 'excludeWarning';

export class InstallButtonWarningBase extends React.Component<InternalProps> {
  static defaultProps = {
    _couldShowWarning: couldShowWarning,
    _log: log,
    _tracking: tracking,
  };

  maybeSendDisplayTrackingEvent = () => {
    const {
      _couldShowWarning,
      _tracking,
      addon,
      experimentEnabled,
      installStatus,
      variant,
    } = this.props;

    if (
      _couldShowWarning({
        addonIsRecommended: addon.is_recommended,
        experimentEnabled,
        installStatus,
      }) &&
      variant
    ) {
      _tracking.sendEvent({
        action: variant,
        category: EXPERIMENT_CATEGORY_SHOW,
        label: addon.name,
      });
    }
  };

  componentDidMount() {
    const { _log, _tracking, variant } = this.props;

    if (!variant) {
      _log.debug(`No variant set for experiment "${EXPERIMENT_ID}"`);
      return;
    }

    _tracking.setDimension({
      dimension: INSTALL_WARNING_EXPERIMENT_DIMENSION,
      value: variant,
    });

    this.maybeSendDisplayTrackingEvent();
  }

  componentDidUpdate({ installStatus: oldInstallStatus }: InternalProps) {
    const { installStatus: newInstallStatus } = this.props;

    if (newInstallStatus !== oldInstallStatus) {
      this.maybeSendDisplayTrackingEvent();
    }
  }

  render() {
    const {
      _couldShowWarning,
      addon,
      experimentEnabled,
      i18n,
      installStatus,
      variant,
    } = this.props;

    if (
      _couldShowWarning({
        addonIsRecommended: addon.is_recommended,
        experimentEnabled,
        installStatus,
      }) &&
      variant === VARIANT_INCLUDE_WARNING
    ) {
      return (
        <Notice
          actionHref="https://support.mozilla.org/kb/recommended-extensions-program"
          actionTarget="_blank"
          actionText={i18n.gettext('Learn more')}
          className="InstallButtonWarning"
          type="warning"
        >
          {i18n.gettext(`This extension isn’t monitored by Mozilla. Make sure you trust the
            extension before you install it.`)}
        </Notice>
      );
    }
    return null;
  }
}

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
  const { addon } = ownProps;
  const installedAddon = (addon && state.installations[addon.guid]) || {};

  return {
    installStatus: installedAddon.status,
  };
}

const InstallButtonWarning: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withExperiment({
    id: EXPERIMENT_ID,
    variantA: VARIANT_INCLUDE_WARNING,
    variantB: VARIANT_EXCLUDE_WARNING,
  }),
)(InstallButtonWarningBase);

export default InstallButtonWarning;
