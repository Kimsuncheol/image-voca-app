import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

type PasswordResetLinkParams = {
  mode?: string;
  oobCode?: string;
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
    };
  } catch {
    return {};
  }
};

const parseQueryParams = (
  params?: Record<string, QueryValue>,
): PasswordResetLinkParams => {
  if (!params) return {};

  const directMode = readParam(params.mode);
  const directCode = readParam(params.oobCode);
  if (directCode) {
    return {
      mode: directMode,
      oobCode: directCode,
    };
  }

  const nested = parseNestedLink(readParam(params.link) || readParam(params.url));

  return {
    mode: nested.mode || directMode,
    oobCode: nested.oobCode,
  };
};

export const usePasswordResetDeepLink = (): PasswordResetLinkParams => {
  const url = Linking.useURL();
  const routeParams = useLocalSearchParams();

  return useMemo(() => {
    const paramsFromUrl = url
      ? parseQueryParams(
          Linking.parse(url).queryParams as Record<string, QueryValue> | undefined,
        )
      : {};

    if (paramsFromUrl.oobCode) {
      return paramsFromUrl;
    }

    return parseQueryParams(routeParams as Record<string, QueryValue>);
  }, [routeParams, url]);
};

export default usePasswordResetDeepLink;
