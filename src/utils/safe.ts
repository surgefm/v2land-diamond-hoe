async function safe<T>(fn: Promise<T>): Promise<T> {
  try {
    const resp = await fn;
    return resp;
  } catch (err) {
    return null;
  }
}

export default safe;
