const root = new URL("../", import.meta.url);

export const ARG_CONFIG = {
  blogUrl: new URL("blog/", root).href,
  corporateUrl: new URL("corporate/", root).href,
  archiveUrl: new URL("archive/", root).href,
  chapter2Url: "../chapter2/index.html"
};
