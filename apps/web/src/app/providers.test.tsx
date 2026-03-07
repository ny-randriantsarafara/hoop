import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Providers } from './providers';

const { sessionProviderMock } = vi.hoisted(() => ({
  sessionProviderMock: vi.fn(({ children }: { readonly children: React.ReactNode }) => children),
}));

vi.mock('next-auth/react', () => ({
  SessionProvider: sessionProviderMock,
}));

vi.mock('@/shared/ui/toast', () => ({
  ToastProvider: ({ children }: { readonly children: React.ReactNode }) => children,
  Toaster: () => null,
}));

describe('Providers', () => {
  beforeEach(() => {
    sessionProviderMock.mockClear();
  });

  it('uses /auth for client session requests', () => {
    renderToStaticMarkup(
      <Providers>
        <div>child</div>
      </Providers>,
    );

    expect(sessionProviderMock).toHaveBeenCalledTimes(1);
    expect(sessionProviderMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ basePath: '/auth' }),
    );
  });
});
