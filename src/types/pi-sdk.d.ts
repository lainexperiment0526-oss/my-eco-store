declare const Pi: {
  init: (options: { version: string }) => void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: any) => void
  ) => Promise<any>;
  createPayment: (
    options: {
      amount: number;
      memo: string;
      metadata: object;
    },
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void;
      onReadyForServerCompletion: (paymentId: string, txid: string) => void;
      onCancel: (paymentId: string) => void;
      onError: (error: any, payment: any) => void;
    }
  ) => Promise<any>;
};