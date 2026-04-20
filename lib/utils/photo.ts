export function getCityPhoto(name: string, country: string): string {
  const query = encodeURIComponent(`${name} ${country} travel`);
  return `https://source.unsplash.com/800x600/?${query}`;
}
