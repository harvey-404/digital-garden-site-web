/** Same-host app paths stay in this tab; external URLs open separately. */
export function isInternalProjectHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}
