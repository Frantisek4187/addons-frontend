/* @flow */
import Helmet from 'react-helmet';
import * as React from 'react';

import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import Page from 'amo/components/Page';

import './styles.scss';

type Props = {|
  title: string,
  metaDescription: string,
  children: React.Node,
|};

const StaticPage = (props: Props) => {
  const { title, metaDescription, children } = props;

  return (
    <Page
      className="StaticPage"
      componentProps={{ header: title }}
      useCardComponent
    >
      <Helmet>
        <title>{title}</title>
      </Helmet>

      <HeadMetaTags description={metaDescription} title={title} />

      <HeadLinks />

      <div className="StaticPage-content">{children}</div>
    </Page>
  );
};

export default StaticPage;
