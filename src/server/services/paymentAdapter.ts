// Payment Provider Abstraction Layer for SubLoop

export interface CreatePaymentOptions {
  userId: string;
  packageId: string;
  amountUsd: number;
  credits: number;
  paymentMethod?: string;
}

export interface PaymentResponse {
  paymentId: string;
  checkoutUrl: string;
  status: 'pending' | 'completed' | 'failed';
  amountUsd: number;
  credits: number;
}

export class MockPaymentProvider {
  private isDevelopmentMode: boolean;

  constructor() {
    this.isDevelopmentMode = true;
    console.log('[MockPaymentProvider] Operating in mock development mode (no live payment credentials required).');
  }

  /**
   * Create a mock payment checkout session / intent
   */
  async createPayment(options: CreatePaymentOptions): Promise<PaymentResponse> {
    const paymentId = `mock_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    return {
      paymentId,
      checkoutUrl: `/wallet?payment_id=${paymentId}&status=mock_success`,
      status: 'completed',
      amountUsd: options.amountUsd,
      credits: options.credits,
    };
  }

  /**
   * Verify mock transaction status
   */
  async verifyPayment(paymentId: string): Promise<{ success: boolean; paymentId: string; status: string }> {
    if (!paymentId) {
      throw new Error('Payment ID is required for verification.');
    }

    return {
      success: true,
      paymentId,
      status: 'completed',
    };
  }

  /**
   * Process mock webhook notifications
   */
  async handleWebhook(rawBody: any, signature: string): Promise<{ received: boolean; event: string }> {
    return {
      received: true,
      event: 'payment.succeeded',
    };
  }

  /**
   * Mock refund a credit purchase
   */
  async refundPayment(paymentId: string, reason?: string): Promise<{ refunded: boolean; refundId: string }> {
    const refundId = `ref_mock_${Date.now()}`;
    return {
      refunded: true,
      refundId,
    };
  }
}

export class PaymentProvider extends MockPaymentProvider {}

// Default payment provider instance using MockPaymentProvider for development
export const paymentProvider = new MockPaymentProvider();
