function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

export function buildPrintFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `photobooth-${year}-${month}-${day}-${hours}${minutes}${seconds}.jpg`;
}
