/* @flow */
/* eslint camelcase: 0 */
import url from 'url';

import base62 from 'base62';
import config from 'config';

import { makeQueryString } from 'core/api';

/*
 * Return a base62 object that encodes/decodes just like how Django does it
 * for cookie timestamps.
 *
 * See:
 * https://github.com/django/django/blob/0b9f366c60134a0ca2873c156b9c80acb7ffd8b5/django/core/signing.py#L180
 */
export function getDjangoBase62() {
  // This is the alphabet used by Django.
  base62.setCharacterSet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  );
  return base62;
}

export const makeQueryStringWithUTM = ({
  utm_source = 'addons.mozilla.org',
  utm_medium = 'referral',
  utm_campaign = 'non-fx-button',
  utm_content,
}: {|
  utm_source?: string,
  utm_medium?: string,
  utm_campaign?: string,
  utm_content: string,
|}): string => {
  return makeQueryString({
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
  });
};

export const getCanonicalURL = ({
  _config = config,
  locationPathname,
}: {|
  _config?: typeof config,
  locationPathname: string,
|}): string => {
  return `${_config.get('baseURL')}${locationPathname}`;
};

type QueryParams = { [key: string]: any };

type MakeInternalExternalURLParams = {|
  _config: typeof config,
  urlString: string,
  internalQueryParams?: QueryParams,
  externalQueryParams?: QueryParams,
|};

export const makeInternalExternalURL = ({
  _config = config,
  externalQueryParams = {},
  internalQueryParams = {},
  urlString,
}: MakeInternalExternalURLParams) => {
  const baseURL = _config.get('baseURL');
  const urlParts = url.parse(urlString, true);

  const queryParams =
    !urlParts.protocol || baseURL.includes(urlParts.host)
      ? internalQueryParams
      : externalQueryParams;

  return url.format({
    ...urlParts,
    // Reset the search string so we can define a new one.
    search: undefined,
    query: { ...urlParts.query, ...queryParams },
  });
};
