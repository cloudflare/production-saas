export interface Recipient {
	/** The recipient's email; required */
	email: string;
	/** The recipient's name, if known */
	name?: string;
}

// Added via wrangler ENVs
const FROM: Recipient = {
	email: SENDGRID_EMAIL,
	name: SENDGRID_NAME,
};

/**
 * The base API interaction
 */
export function email(label: string, templateid: string, recipient: Recipient, inject: Dict<string> = {}) {
	return fetch('https://api.sendgrid.com/v3/mail/send', {
		method: 'POST',
		headers: {
			// Added via wrangler secret
			'Authorization': `Bearer ${SENDGRID_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: FROM,
			reply_to: FROM,
			template_id: templateid,
			tracking_settings: {
				click_tracking: {
					enable: true,
					enable_text: true
				},
				open_tracking: {
					enable: true
				}
			},
			personalizations: [{
				to: [recipient],
				dynamic_template_data: inject
			}]
		})
	}).then(r => {
		if (r.ok) return;
		// TODO: Attach proper error logging service
		return r.text().then(text => {
			console.error('[EMAIL] Error sending "%s" to "%s" :: %s', label, recipient.email, text);
		});
	});
}
