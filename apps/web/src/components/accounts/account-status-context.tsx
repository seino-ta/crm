'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import type { AccountStatus } from '@/lib/types';

const AccountStatusContext = createContext<{ status: AccountStatus; setStatus: (status: AccountStatus) => void } | null>(null);

export function AccountStatusProvider({ initialStatus, children }: { initialStatus: AccountStatus; children: React.ReactNode }) {
  const [status, setStatus] = useState<AccountStatus>(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  return <AccountStatusContext.Provider value={{ status, setStatus }}>{children}</AccountStatusContext.Provider>;
}

export function useAccountStatus() {
  return useContext(AccountStatusContext);
}
