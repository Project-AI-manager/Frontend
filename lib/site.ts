export const SITE_NAME = "Автопилот";
export const SITE_HOST = "xn--80aesmncewf.space";
export const SITE_HOST_DISPLAY = "автопилот.space";
export const SITE_ORIGIN = `https://${SITE_HOST}`;
export const SITE_ORIGIN_DISPLAY = `https://${SITE_HOST_DISPLAY}`;

/**
 * Возвращает технически совместимый URL для href, canonical и API браузера.
 * В DNS кириллический домен представлен в ASCII (Punycode).
 */
export function getSiteUrl(path = "/") {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}

/** Возвращает тот же URL в человекочитаемом виде для UI и буфера обмена. */
export function getDisplaySiteUrl(path = "/") {
  return getSiteUrl(path).replace(SITE_HOST, SITE_HOST_DISPLAY);
}
