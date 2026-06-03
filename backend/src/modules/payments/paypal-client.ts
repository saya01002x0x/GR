const baseFetch = async (
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  endpoint: string,
  method = 'GET',
  body?: unknown,
) => {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal API error: ${response.status} - ${error}`);
  }

  return { data: await response.json() };
};

export async function getAccessToken(clientId: string, clientSecret: string, baseUrl: string) {
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function createProduct(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  body: { name: string; type?: string; description?: string },
) {
  return baseFetch(clientId, clientSecret, baseUrl, '/v1/catalogs/products', 'POST', body);
}

export async function createPrice(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  productId: string,
  body: {
    unit_amount: { currency_code: string; value: string };
    frequency: string;
    interval_unit?: string;
    name: string;
    description?: string;
  },
) {
  return baseFetch(clientId, clientSecret, baseUrl, '/v1/billing/plans', 'POST', {
    product_id: productId,
    name: body.name || 'Subscription',
    description: body.description || 'Monthly subscription',
    billing_cycles: [
      {
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: { value: body.unit_amount.value, currency_code: body.unit_amount.currency_code },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: '0', currency_code: body.unit_amount.currency_code },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  });
}

export async function createSubscription(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  body: {
    plan_id: string;
    subscriber?: { email_address?: string; name?: { given_name?: string; surname?: string } };
    application_context?: Record<string, string>;
    custom_id?: string;
  },
) {
  return baseFetch(clientId, clientSecret, baseUrl, '/v1/billing/subscriptions', 'POST', body);
}

export async function getSubscription(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  subscriptionId: string,
) {
  return baseFetch(clientId, clientSecret, baseUrl, `/v1/billing/subscriptions/${subscriptionId}`);
}

export async function activateSubscription(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  subscriptionId: string,
) {
  return baseFetch(
    clientId,
    clientSecret,
    baseUrl,
    `/v1/billing/subscriptions/${subscriptionId}/activate`,
    'POST',
    {},
  );
}

export async function cancelSubscription(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  subscriptionId: string,
  reason?: string,
) {
  return baseFetch(
    clientId,
    clientSecret,
    baseUrl,
    `/v1/billing/subscriptions/${subscriptionId}/cancel`,
    'POST',
    { reason: reason || 'User requested cancellation' },
  );
}

export async function getSubscriptionTransactions(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  subscriptionId: string,
  startDate: string,
  endDate: string,
) {
  return baseFetch(
    clientId,
    clientSecret,
    baseUrl,
    `/v1/billing/subscriptions/${subscriptionId}/transactions?start_date=${startDate}&end_date=${endDate}`,
  );
}