export async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method, credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
export const iso = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const hijri = (d, opt = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', opt).format(d);
