function removeURLQuery(url: string): string {
  if (url.indexOf('?') >= 0) {
    url = url.slice(0, url.indexOf('?'));
  }
  return url;
}

export default removeURLQuery;
