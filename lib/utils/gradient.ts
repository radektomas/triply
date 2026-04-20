const GRADIENTS = [
  "linear-gradient(135deg, #0f4c81 0%, #1a7ab5 50%, #2da0d0 100%)",
  "linear-gradient(135deg, #0d7377 0%, #14a9ad 50%, #32cdc0 100%)",
  "linear-gradient(135deg, #b5451b 0%, #e07b39 50%, #f4a35a 100%)",
  "linear-gradient(135deg, #4a1942 0%, #8b3a8b 50%, #c06fc0 100%)",
  "linear-gradient(135deg, #1a3a5c 0%, #2e6da4 50%, #4a9fd4 100%)",
  "linear-gradient(135deg, #3d5a00 0%, #6a9e00 50%, #96cc2a 100%)",
  "linear-gradient(135deg, #7b2d00 0%, #c45200 50%, #e87a30 100%)",
  "linear-gradient(135deg, #1b3a4b 0%, #2d6a8a 50%, #4a9bbe 100%)",
  "linear-gradient(135deg, #2c1654 0%, #5c3a9e 50%, #8a67cc 100%)",
  "linear-gradient(135deg, #004d40 0%, #00796b 50%, #26a69a 100%)",
];

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

export function getGradient(id: string): string {
  return GRADIENTS[djb2(id) % GRADIENTS.length];
}
