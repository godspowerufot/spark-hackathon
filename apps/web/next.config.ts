import type { NextConfig } from 'next'
import path from 'node:path'

const empty = path.join(__dirname, 'src/lib/empty-module.ts')

const nextConfig: NextConfig = {
  serverExternalPackages: ['@coinbase/cdp-sdk', '@base-org/account'],
  webpack: (config) => {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@x402/core': empty,
      '@x402/core/client': empty,
      '@x402/core/http': empty,
      '@x402/evm': empty,
      '@x402/evm/exact/client': empty,
      '@x402/svm': empty,
      '@x402/svm/exact/client': empty,
      '@x402/extensions': empty,
    }
    return config
  },
  turbopack: {
    resolveAlias: {
      '@x402/core': './src/lib/empty-module.ts',
      '@x402/core/client': './src/lib/empty-module.ts',
      '@x402/core/http': './src/lib/empty-module.ts',
      '@x402/evm': './src/lib/empty-module.ts',
      '@x402/evm/exact/client': './src/lib/empty-module.ts',
      '@x402/svm': './src/lib/empty-module.ts',
      '@x402/svm/exact/client': './src/lib/empty-module.ts',
      '@x402/extensions': './src/lib/empty-module.ts',
    },
  },
}

export default nextConfig
