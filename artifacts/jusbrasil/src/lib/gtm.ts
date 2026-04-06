export function pushDataLayer(event: string, data?: Record<string, any>) {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ event, ...data });
}
