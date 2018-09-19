/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { nl2br, sanitizeHTML } from 'core/utils';
import LoadingText from 'ui/components/LoadingText';
import UserRating from 'ui/components/UserRating';
import type { UserReviewType } from 'amo/actions/reviews';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  byLine: React.Node | null,
  children?: React.Node,
  className?: string,
  controls?: React.Node | null,
  review: ?UserReviewType,
  showDeveloperResponseHeading?: boolean,
  showRating?: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

function reviewBody({
  content,
  html,
}: {|
  content?: React.Node | string,
  html?: React.Node,
|}) {
  invariant(
    content !== undefined || html !== undefined,
    'content or html is required',
  );

  const bodyAttr = {};

  if (content) {
    bodyAttr.children = content;
  } else {
    bodyAttr.dangerouslySetInnerHTML = html;
  }

  return (
    <div
      className={makeClassName('UserReview-body', {
        // Add an extra class if the content is an empty string.
        'UserReview-emptyBody': !content && !html,
      })}
      {...bodyAttr}
    />
  );
}

export const UserReviewBase = (props: InternalProps) => {
  const {
    byLine,
    children,
    className,
    controls,
    i18n,
    review,
    showRating = false,
    showDeveloperResponseHeading = false,
  } = props;

  let body = reviewBody({ content: <LoadingText /> });

  if (review) {
    if (review.body) {
      body = reviewBody({
        html: sanitizeHTML(nl2br(review.body), ['br']),
      });
    } else {
      body = reviewBody({ content: '' });
    }
  }

  return (
    <div className={makeClassName('UserReview', className)}>
      <div className="UserReview-byLine">
        {review && showRating ? (
          <UserRating styleSize="small" review={review} readOnly />
        ) : null}
        {review &&
          showDeveloperResponseHeading && (
            <span className="UserReview-byLine-developerResponse">
              {i18n.gettext('Developer response')}
            </span>
          )}
        {byLine}
      </div>
      {body}
      {controls}
      {children}
    </div>
  );
};

const UserReview: React.ComponentType<Props> = compose(translate())(
  UserReviewBase,
);

export default UserReview;
