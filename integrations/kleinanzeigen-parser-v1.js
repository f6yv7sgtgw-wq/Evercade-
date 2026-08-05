/**
 * Project Evercade 0.9 – GenericParser/Kleinanzeigen adapter contract.
 * This module is intentionally network-neutral. The deployment can inject
 * a transport implementing execute(request) without changing the UI model.
 */
export const API_VERSION = 'generic-parser-module-v1';

export function createKleinanzeigenRequest(items, options = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  return {
    apiVersion: API_VERSION,
    consumer: 'evercade-collection-manager',
    requestedAt: new Date().toISOString(),
    source: 'kleinanzeigen',
    search: {
      cadence: 'daily',
      locale: 'de-DE',
      currency: 'EUR',
      location: options.location ?? null,
      radiusKm: Number.isFinite(options.radiusKm) ? options.radiusKm : null,
      shippingAllowed: options.shippingAllowed !== false,
      acceptBundles: options.acceptBundles === true,
      acceptIncomplete: options.acceptIncomplete === true,
      includeRejected: options.includeRejected !== false
    },
    items: items.map(item => ({
      externalKey: String(item.key ?? `${item.series}-${item.number}`),
      title: String(item.title),
      series: String(item.series),
      number: Number(item.number),
      requiredTerms: ['Evercade', ...(item.requiredTerms ?? [])],
      excludedTerms: item.excludedTerms ?? ['Konsole', 'Controller', 'Case', 'Hülle leer'],
      maxPrice: Number.isFinite(item.maxPrice) ? item.maxPrice : null
    }))
  };
}

export function normalizeKleinanzeigenResponse(payload) {
  if (!payload || payload.apiVersion !== API_VERSION || !Array.isArray(payload.results)) {
    throw new TypeError('Invalid generic-parser-module-v1 response');
  }
  return payload.results.map(result => ({
    key: String(result.externalKey),
    checkedAt: result.checkedAt ?? new Date().toISOString(),
    offers: (result.offers ?? []).map(offer => ({
      id: String(offer.id),
      source: 'Kleinanzeigen',
      title: String(offer.title ?? ''),
      price: Number(offer.price),
      shipping: offer.shipping == null ? null : Number(offer.shipping),
      total: offer.total == null ? null : Number(offer.total),
      shippingKnown: offer.shippingKnown === true,
      condition: String(offer.condition ?? 'Gebraucht'),
      availability: 'in_stock',
      sellerType: 'Privat',
      color: String(offer.color ?? 'Automatisch'),
      url: String(offer.url),
      confidence: Number(offer.confidence ?? 0),
      verifiedAt: offer.verifiedAt ?? result.checkedAt ?? new Date().toISOString()
    })),
    rejected: result.rejected ?? []
  }));
}
