import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

type PasswordResetLinkParams = {
  mode?: string;
  oobCode?: string;
  apiKey?: string;
  continueUrl?: string;
};

type QueryValue = string | string[] | undefined;

const readParam = (value: QueryValue) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const parseNestedLink = (link?: string): PasswordResetLinkParams => {
  if (!link) return {};

  try {
    const decodedLink = decodeURIComponent(link);
    const parsedLink = Linking.parse(decodedLink);
    const nestedParams = parsedLink.queryParams as
      | Record<string, QueryValue>
      | undefined;

    return {
      mode: readParam(nestedParams?.mode),
      oobCode: readParam(nestedParams?.oobCode),
      apiKey: readParam(nestedParams?.apiKey),
      continueUrl: readParam(nestedParams?.continueUrl),
    };
  } catch {
    return {};
  }
};

export const parsePasswordResetQueryParams = (
  params?: Record<string, QueryValue>,
): PasswordResetLinkParams => {
  if (!params) return {};

  const directMode = readParam(params.mode);
  const directCode = readParam(params.oobCode);
  if (directCode) {
    return {
      mode: directMode,
      oobCode: directCode,
      apiKey: readParam(params.apiKey),
      continueUrl: readParam(params.continueUrl),
    };
  }

  const nested = parseNestedLink(readParam(params.link) || readParam(params.url));

  return {
    mode: nested.mode || directMode,
    oobCode: nested.oobCode,
    apiKey: nested.apiKey || readParam(params.apiKey),
    continueUrl: nested.continueUrl || readParam(params.continueUrl),
  };
};

export const usePasswordResetDeepLink = (): PasswordResetLinkParams => {
  const url = Linking.useURL();
  const routeParams = useLocalSearchParams();

  return useMemo(() => {
    const paramsFromUrl = url
      ? parsePasswordResetQueryParams(
          Linking.parse(url).queryParams as Record<string, QueryValue> | undefined,
        )
      : {};

    if (paramsFromUrl.oobCode) {
      return paramsFromUrl;
    }

    return parsePasswordResetQueryParams(routeParams as Record<string, QueryValue>);
  }, [routeParams, url]);
};

export default usePasswordResetDeepLink;
