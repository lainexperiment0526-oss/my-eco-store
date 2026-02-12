// Quick test for token integration (sandbox/mainnet)
import { usePi } from '@/contexts/PiContext';
import { PI_CONFIG } from '@/config/pi-config';

export const QuickDropTest = () => {
  const { 
    isAuthenticated, 
    getDROPBalance
  } = usePi();

  const testTokens = async () => {
    if (!isAuthenticated) {
      console.log('❌ Please authenticate first');
      return;
    }

    console.log('🔍 Checking wallet tokens...');
    const balance = await getDROPBalance();
    console.log('Wallet tokens:', balance);

    // Note: Previous DROP-specific functions are deprecated
    console.warn('ℹ️ This test was for testnet tokens only');
    console.warn(`ℹ️ Use generic token detection for ${PI_CONFIG.SANDBOX_MODE ? 'sandbox' : 'mainnet'}`);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">{PI_CONFIG.SANDBOX_MODE ? 'Sandbox' : 'Mainnet'} Token Test</h3>
      <button 
        onClick={testTokens}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Token Detection
      </button>
      <p className="text-sm text-gray-600 mt-2">
        Note: Previous DROP token was testnet-only. This now tests generic {PI_CONFIG.SANDBOX_MODE ? 'sandbox' : 'mainnet'} token detection.
      </p>
    </div>
  );
};