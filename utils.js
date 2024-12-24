export function generateRandomStrings(count) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: count }, () => {
    return Array.from({ length: Math.floor(Math.random() * 101) + 50 }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('');
  });
}
