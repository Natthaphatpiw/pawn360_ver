/**
 * Webhook Service
 * Handles asynchronous communication with Customer System (https://pawn360.vercel.app/)
 *
 * Shop System (this): https://pawn360-ver.vercel.app/
 * Customer System: https://pawn360.vercel.app/
 */

// Customer System Base URL
export const CUSTOMER_SYSTEM_URL = process.env.CUSTOMER_SYSTEM_URL || 'https://pawn360.vercel.app';

interface WebhookPayload {
  notificationId: string;
  type: 'action_response' | 'payment_received' | 'payment_verified';
  data: any;
  timestamp: string;
  shopSystemUrl?: string; // URL ของระบบร้านค้าที่ส่งมา
}

interface WebhookResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  attempts?: number;
}

/**
 * Send webhook to external system with retry mechanism
 * @param callbackUrl - The URL to send webhook to
 * @param payload - The data to send
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns WebhookResult
 */
export async function sendWebhook(
  callbackUrl: string,
  payload: WebhookPayload,
  maxRetries: number = 3
): Promise<WebhookResult> {
  let attempts = 0;
  let lastError: string = '';

  while (attempts < maxRetries) {
    attempts++;

    try {
      console.log(`[Webhook] Attempt ${attempts}/${maxRetries} to ${callbackUrl}`, {
        notificationId: payload.notificationId,
        type: payload.type
      });

      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Pawn360-Webhook/1.0',
          'X-Webhook-Signature': generateWebhookSignature(payload), // For security
        },
        body: JSON.stringify(payload),
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000),
      });

      // Consider 2xx status codes as success
      if (response.ok) {
        console.log(`[Webhook] Success on attempt ${attempts}`, {
          notificationId: payload.notificationId,
          statusCode: response.status
        });

        return {
          success: true,
          statusCode: response.status,
          attempts
        };
      }

      // Non-2xx status code
      lastError = `HTTP ${response.status}: ${response.statusText}`;
      console.warn(`[Webhook] Failed with status ${response.status}`, {
        notificationId: payload.notificationId,
        attempt: attempts
      });

    } catch (error: any) {
      lastError = error.message || 'Unknown error';
      console.error(`[Webhook] Error on attempt ${attempts}:`, {
        notificationId: payload.notificationId,
        error: lastError
      });
    }

    // Wait before retry (exponential backoff)
    if (attempts < maxRetries) {
      const delayMs = Math.min(1000 * Math.pow(2, attempts - 1), 10000); // Max 10s
      console.log(`[Webhook] Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // All retries failed
  console.error(`[Webhook] All ${maxRetries} attempts failed`, {
    notificationId: payload.notificationId,
    lastError
  });

  return {
    success: false,
    error: lastError,
    attempts
  };
}

/**
 * Generate webhook signature for security validation
 * Customer system can verify this signature to ensure webhook is authentic
 */
function generateWebhookSignature(payload: WebhookPayload): string {
  // In production, use HMAC with a shared secret key
  // For now, use a simple approach
  const secret = process.env.WEBHOOK_SECRET || 'pawn360-webhook-secret';

  // Simple signature: hash of payload + secret
  // In production, use crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')
  return Buffer.from(`${payload.notificationId}-${payload.timestamp}-${secret}`).toString('base64');
}

/**
 * Send action response webhook (confirm/reject) to Customer System
 */
export async function sendActionResponseWebhook(
  callbackUrl: string,
  notificationId: string,
  action: 'confirm' | 'reject',
  message: string,
  qrCodeUrl: string | null,
  storeId: string,
  customerId: string,
  contractId: string
): Promise<WebhookResult> {
  const payload: WebhookPayload = {
    notificationId,
    type: 'action_response',
    data: {
      action,
      confirmed: action === 'confirm',
      message,
      qrCodeUrl,
      storeId,
      customerId,
      contractId,
    },
    timestamp: new Date().toISOString(),
    shopSystemUrl: 'https://pawn360-ver.vercel.app'
  };

  return await sendWebhook(callbackUrl, payload);
}

/**
 * Send payment received webhook (when customer uploads payment proof) to Customer System
 */
export async function sendPaymentReceivedWebhook(
  callbackUrl: string,
  notificationId: string,
  paymentProofUrl: string,
  storeId: string,
  customerId: string,
  contractId: string
): Promise<WebhookResult> {
  const payload: WebhookPayload = {
    notificationId,
    type: 'payment_received',
    data: {
      paymentProofUrl,
      storeId,
      customerId,
      contractId,
      status: 'payment_pending', // Waiting for staff verification
    },
    timestamp: new Date().toISOString(),
    shopSystemUrl: 'https://pawn360-ver.vercel.app'
  };

  return await sendWebhook(callbackUrl, payload);
}

/**
 * Send payment verified webhook (when staff confirms payment) to Customer System
 */
export async function sendPaymentVerifiedWebhook(
  callbackUrl: string,
  notificationId: string,
  verified: boolean,
  message: string,
  storeId: string,
  customerId: string,
  contractId: string
): Promise<WebhookResult> {
  const payload: WebhookPayload = {
    notificationId,
    type: 'payment_verified',
    data: {
      verified,
      message,
      storeId,
      customerId,
      contractId,
      status: verified ? 'completed' : 'rejected',
    },
    timestamp: new Date().toISOString(),
    shopSystemUrl: 'https://pawn360-ver.vercel.app'
  };

  return await sendWebhook(callbackUrl, payload);
}
