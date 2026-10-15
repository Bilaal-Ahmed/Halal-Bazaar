import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiRequest } from '../lib/api';

export interface CheckoutConfig {
  taxRates: { PKR: number; USD: number | null };
  legacyPriceCurrency: 'PKR' | 'USD' | null;
  cashOnDeliveryCountries: string[];
  bankTransferEnabled: { PKR: boolean; USD: boolean };
}

interface CheckoutConfigContextValue {
  config: CheckoutConfig | null;
  error: Error | null;
}

const CheckoutConfigContext = createContext<CheckoutConfigContextValue | undefined>(
  undefined
);

export function CheckoutConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<CheckoutConfig>('/api/checkout/config')
      .then((result) => {
        if (active) setConfig(result);
      })
      .catch((cause) => {
        console.error('Could not load checkout configuration:', cause);
        if (active) {
          setError(
            cause instanceof Error
              ? cause
              : new Error('Checkout configuration could not be loaded.')
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CheckoutConfigContext.Provider value={{ config, error }}>
      {children}
    </CheckoutConfigContext.Provider>
  );
}

export function useCheckoutConfig() {
  const context = useContext(CheckoutConfigContext);
  if (!context) {
    throw new Error('useCheckoutConfig must be used within CheckoutConfigProvider');
  }
  return context;
}
