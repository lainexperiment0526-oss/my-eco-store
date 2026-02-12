/**
 * Pi Network Hook for DropLink
 * Based on FlappyPi working implementation
 */

import { useState, useEffect, useCallback } from 'react';
import { piAuth, piPayment } from '../config/piSDK';

export interface PiUser {
  uid: string;
  username: string;
  accessToken: string;
  wallet_address?: string;
}

export const usePiNetwork = () => {
  const [user, setUser] = useState<PiUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    try {
      // Pi SDK authentication state is managed through Pi.authenticate()
      // We'll check if window.Pi exists
      if (typeof window !== 'undefined' && window.Pi) {
        // Try to get authentication state from local storage or context
        const storedAuth = localStorage.getItem('pi-auth-state');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          setUser(authData.user);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  }, []);

  // Authenticate user
  const authenticate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authResult = await piAuth.authenticate();
      setUser(authResult.user);
      setIsAuthenticated(true);
      // Store auth state
      localStorage.setItem('pi-auth-state', JSON.stringify({ user: authResult.user }));
      return authResult;
    } catch (error: any) {
      setError(error?.message || 'Authentication failed');
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(() => {
    try {
      piAuth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      // Clear stored auth state
      localStorage.removeItem('pi-auth-state');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  // Create payment
  const createPayment = useCallback(async (
    amount: number, 
    memo: string, 
    metadata?: any
  ) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated');
    }
    setIsLoading(true);
    setError(null);
    try {
      const payment = await piPayment.createPayment(amount, memo, metadata);
      return payment;
    } catch (error: any) {
      setError(error?.message || 'Payment creation failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    authenticate,
    signOut,
    createPayment,
  };
};
