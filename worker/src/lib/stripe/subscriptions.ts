import { send } from '.';

import type { Stripe } from '.';
import type { Price } from './prices';
import type { Customer } from './customers';

export interface Subscription {
  id: `sub_${string}`;
  object: 'subscription';
  application_fee_percent: null;
  billing_cycle_anchor: Stripe.Timestamp;
  billing_thresholds: null;
  cancel_at: Nullable<Stripe.Timestamp>;
  cancel_at_period_end: false;
  canceled_at: Nullable<Stripe.Timestamp>;
  collection_method: 'charge_automatically' | 'send_invoice';
  created: Stripe.Timestamp;
  current_period_end: Stripe.Timestamp;
  current_period_start: Stripe.Timestamp;
  customer: Customer['id'];
  days_until_due: Nullable<number>;
  default_payment_method: null;
  default_source: null;
  default_tax_rates: [];
  discount: null;
  ended_at: Nullable<Stripe.Timestamp>;
  items: {
    object: 'list';
    data: [
      {
        id: `si_${string}`;
        object: 'subscription_item';
        billing_thresholds: null;
        created: Stripe.Timestamp;
        metadata: Stripe.Metadata;
        quantity: number;
        price: Price;
        subscription: Subscription['id'];
        tax_rates: [];
      }
    ];
    has_more: boolean;
    url: string;
  };
  latest_invoice: null;
  livemode: false;
  metadata: {};
  next_pending_invoice_item_invoice: null;
  pause_collection: null;
  pending_invoice_item_interval: null;
  pending_setup_intent: null;
  pending_update: null;
  schedule: null;
  start_date: 1620338144;
	status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'all' | 'ended';
  transfer_data: null;
  trial_end: Nullable<Stripe.Timestamp>;
  trial_start: Nullable<Stripe.Timestamp>;
};

type Options = Partial<
	{ limit: number; price: Price['id'] }
	& Pick<Subscription, 'customer' | 'status' | 'collection_method'>
>;

export function list(options?: Options) {
	return send<Subscription[]>('GET', 'subscriptions', options);
}

export function find(id: string) {
	return send<Subscription>('GET', `subscriptions/${id}`);
}

export function create(customerid: Customer['id'], items: Price['id'][]) {
	return send<Subscription>('POST', 'subscriptions', {
		customer: customerid,
		items: items.map(x => {
			return { price: x }
		})
	});
}

export function update(subid: Subscription['id'], values: Partial<Subscription>, items: Price['id'][] = []) {
	if (items.length > 0) {
		Object.assign(values, {
			items: items.map(x => ({ price: x }))
		});
	}

	return send<Subscription>('POST', `subscriptions/${subid}`, values);
}

export function cancel(subid: Subscription['id']) {
	return send('DELETE', `subscriptions/${subid}`);
}
