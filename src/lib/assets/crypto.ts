/**
 * Crypto Calculator - Calculates Zakat on cryptocurrency holdings
 * - Trading crypto: 100% of market value is zakatable if hawl is met
 * - Staked/Locked crypto: Only accessible amount is zakatable
 * - Mining rewards: 100% of earned rewards are zakatable
 * - Converts all crypto values to local currency for calculation
 * - Applies standard 2.5% Zakat rate on zakatable amounts
 */
import { AssetType, AssetBreakdown, ZAKAT_RATE } from './types'
import { CryptoValues } from '@/store/types'

export const crypto: AssetType = {
  id: 'crypto',
  name: 'Cryptocurrency',
  color: '#F7931A', // Bitcoin orange

  calculateTotal: (values: CryptoValues): number => {
    if (!values || !Array.isArray(values.coins)) return 0
    return values.coins.reduce((sum, coin) => sum + (coin.marketValue || 0), 0)
  },

  calculateZakatable: (values: CryptoValues, _prices: unknown, hawlMet: boolean): number => {
    if (!hawlMet || !values || !Array.isArray(values.coins)) return 0
    return values.coins.reduce((sum, coin) => sum + (coin.marketValue || 0), 0)
  },

  getBreakdown: (values: CryptoValues, _prices: unknown, hawlMet: boolean): AssetBreakdown => {
    if (!values || !Array.isArray(values.coins)) {
      return {
        total: 0,
        zakatable: 0,
        zakatDue: 0,
        items: {
          cryptocurrency: {
            value: 0,
            isZakatable: false,
            zakatable: 0,
            zakatDue: 0,
            label: 'Cryptocurrency',
            tooltip: 'No cryptocurrencies added yet',
            percentage: 0
          }
        }
      }
    }

    const total = values.coins.reduce((sum, coin) => sum + (coin.marketValue || 0), 0)
    const zakatable = hawlMet ? total : 0
    const zakatDue = zakatable * ZAKAT_RATE

    // Aggregate coins by symbol
    const aggregatedCoins = values.coins.reduce((acc, coin) => {
      const symbol = coin.symbol.toUpperCase()
      if (!acc[symbol]) {
        acc[symbol] = {
          quantity: 0,
          marketValue: 0,
          currentPrice: coin.currentPrice
        }
      }
      acc[symbol].quantity += coin.quantity
      acc[symbol].marketValue += coin.marketValue
      return acc
    }, {} as Record<string, { quantity: number; marketValue: number; currentPrice: number }>)

    const items: Record<string, {
      value: number
      isZakatable: boolean
      zakatable: number
      zakatDue: number
      label: string
      tooltip: string
      percentage?: number
    }> = {}

    // If no coins, add a default item
    if (Object.keys(aggregatedCoins).length === 0) {
      items.cryptocurrency = {
        value: 0,
        isZakatable: false,
        zakatable: 0,
        zakatDue: 0,
        label: 'Cryptocurrency',
        tooltip: 'No cryptocurrencies added yet',
        percentage: 0
      }
    } else {
      // Create items from aggregated coins
      Object.entries(aggregatedCoins).forEach(([symbol, data]) => {
        const itemZakatable = hawlMet ? data.marketValue : 0
        const itemZakatDue = itemZakatable * ZAKAT_RATE

        items[symbol.toLowerCase()] = {
          value: data.marketValue,
          isZakatable: hawlMet,
          zakatable: itemZakatable,
          zakatDue: itemZakatDue,
          label: `${symbol} (${data.quantity} coins)`,
          tooltip: `${data.quantity} ${symbol} at ${data.currentPrice.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
          })} each`,
          percentage: total > 0 ? (data.marketValue / total) * 100 : 0
        }
      })
    }

    return {
      total,
      zakatable,
      zakatDue,
      items
    }
  }
} 