import { OPENPAY_LOGO_URL, startOpenPayConnect } from '@/lib/openpay';

interface OpenPayAuthButtonProps {
  scope?: string;
  label?: string;
  className?: string;
}

export function OpenPayAuthButton({
  scope,
  label = 'Sign in with OpenPay',
  className = '',
}: OpenPayAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={() => startOpenPayConnect(scope)}
      className={`inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1652f0] px-5 py-3 font-semibold text-white transition-transform active:scale-[0.96] hover:opacity-90 ${className}`}
    >
      <img src={OPENPAY_LOGO_URL} width={20} height={20} alt="" className="h-5 w-5" />
      {label}
    </button>
  );
}
