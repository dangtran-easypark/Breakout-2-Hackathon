import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../redux/slices/counter';

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  store?: any;
}

interface WrapperProps {
  children: ReactNode;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialState,
    store = configureStore({ 
      reducer: { counter: counterReducer },
      preloadedState: initialState 
    }),
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult & { store: any } {
  function Wrapper({ children }: WrapperProps) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), store };
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };