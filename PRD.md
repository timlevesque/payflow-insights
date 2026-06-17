# PayFlow Insights — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-06-16  
**Status:** Draft

---

## Problem

Founders and product teams waste months building products nobody wants to pay for. Smoke testing (showing a realistic checkout experience before a product exists) is a proven validation technique, but current tools require stitching together landing page builders, payment processors, and analytics — or accepting a toy-like experience that undermines data quality.

Poor simulation realism = poor data. If a test buyer hesitates because it looks fake, the signal is worthless.

---

## Goal

A no-account-required tool that lets anyone build a realistic payment simulation page in under 5 minutes, share it, and get meaningful intent data back — without charging anyone or requiring a line of code.

---

## Target Users

**Primary:** Early-stage founders and indie hackers validating a product idea before building  
**Secondary:** Product managers running pricing experiments inside existing companies  
**Tertiary:** Agencies validating client ideas before scoping proposals

---

## Core Principles

1. **Visual first** — users start from a fully rendered, realistic checkout page and edit it into what they want. No wizard, no setup questions.
2. **The link is the product** — everything before sharing the link is just editing. Get them there fast.
3. **No forced account creation** — email is the only gate, collected at the moment it provides value ("where should we send your results?")
4. **Legally sound by default** — disclosure and consent are non-negotiable platform requirements, not optional creator settings.
5. **Realism without deception** — the simulation must feel real enough to generate honest intent data, but buyers must never be misled about payment.

---

## User Flows

### Creator Flow

1. Land on marketing site → click "Create a simulation"
2. Choose a starting template (SaaS subscription / Digital product / Service booking / Physical product)
3. Dropped directly into a live, editable simulation page — no forms, no wizard
4. Edit inline: click any element to change it (product name, description, image, price, quantity options, colors)
5. Floating toolbar handles structural choices: payment model, field visibility, branding
6. Mobile preview toggle available at all times
7. Hit "Get my link" → one field appears: email address
8. Receive shareable simulation URL + private dashboard URL immediately via email
9. Share simulation link, monitor dashboard

### Buyer Flow

1. Land on simulation page — looks and feels like a real checkout
2. Fill in: name, email, quantity (if applicable)
3. See total price calculated in real time
4. Hit "Complete Purchase" / "Subscribe Now" / etc.
5. **Disclosure moment:** Friendly reveal page — "This was a purchase simulation. No payment was taken." with explanation of why
6. **Consent moment:** Opt-in checkbox — "Yes, [Creator Name] can follow up with me about this product"
7. Short optional survey: "What almost stopped you?" / "What would you pay?" (creator-configurable)
8. Done — buyer optionally leaves email confirmed and expectation set

---

## Features

### MVP (V1)

#### Simulation Builder
- [ ] 4 starting templates: SaaS subscription, digital product, service/booking, physical product
- [ ] Inline editing for all visible elements — click to edit, no separate form panel
- [ ] Editable fields: product name, tagline, description, price, quantity options, CTA button text, hero image
- [ ] Payment model selector: one-time / subscription (monthly or annual) / free + account creation
- [ ] Color/brand customization: primary color, button color, logo upload
- [ ] Mobile preview toggle in editor
- [ ] Real-time total price calculation as buyer changes quantity

#### Checkout Experience
- [ ] Buyer fields: name, email, quantity selector
- [ ] Stylized card display (shows card brand/last-4 placeholder — NOT a real card input field)
- [ ] "Simulation" badge — small, present but not overbearing, non-removable
- [ ] Order summary sidebar with line items and total
- [ ] Mobile-responsive layout

#### Disclosure & Consent
- [ ] Reveal page shown immediately after buyer hits the CTA — non-bypassable
- [ ] Creator-editable reveal message (default provided)
- [ ] Opt-in checkbox: buyer consents to creator follow-up (unchecked by default)
- [ ] Platform-provided privacy notice on every simulation page (non-removable)
- [ ] Data deletion link in reveal page footer

#### Link & Access
- [ ] Shareable simulation URL (e.g. `payflow.com/s/abc123`)
- [ ] Private dashboard URL sent to creator email (e.g. `payflow.com/d/xyz789`) — no login required
- [ ] Dashboard URL is the only access mechanism — no passwords, no accounts

#### Analytics Dashboard
- [ ] Funnel: Visitors → Started checkout → Completed checkout
- [ ] Lead table: name, email, quantity, price seen, timestamp, consented (yes/no)
- [ ] CSV export
- [ ] Email notifications: first lead, 10 visitors, 10 leads

---

### V2

#### A/B Price Testing
- [ ] Run 2 price points simultaneously, traffic split 50/50
- [ ] Dashboard shows conversion rate per variant
- [ ] Statistical significance indicator
- [ ] Winner declaration when significance is reached

#### AI-Assisted Setup
- [ ] Generate product name, description, and tagline from a one-line prompt
- [ ] Auto-suggest pricing based on product category

#### Post-Reveal Survey Builder
- [ ] Creator can add 1-3 questions shown after the reveal
- [ ] Question types: multiple choice, short text, rating scale
- [ ] Survey responses shown in dashboard alongside lead data

#### Integrations
- [ ] Webhook on new lead (for Zapier/Make)
- [ ] Native Mailchimp and ConvertKit integration
- [ ] Slack notification on new lead
- [ ] Calendly embed on reveal page (book a discovery call)

#### Dashboard Improvements
- [ ] Abandoned checkout tracking (started but didn't complete)
- [ ] Device breakdown (mobile vs desktop)
- [ ] Traffic source (utm_source passthrough)
- [ ] Weekly email digest while simulation is active

---

### V3

#### Go Live
- [ ] "Convert to real checkout" button — connects a Stripe account, keeps the same URL, switches from simulation to real payment processing

#### Agency / Team Features
- [ ] Team workspaces — share access to dashboards across collaborators
- [ ] White-label mode — remove PayFlow branding, use custom domain
- [ ] Client management view — see all simulations across clients

#### Import from URL
- [ ] Paste an existing website URL — scrapes logo, colors, and font to pre-populate branding

---

## Data Model

### Simulation
- `id` (unique, used in shareable URL)
- `dashboard_id` (separate unique ID for dashboard URL)
- `creator_email`
- `template_type`
- `payment_model`
- `product_name`, `tagline`, `description`
- `hero_image_url`
- `price`, `currency`
- `quantity_options` (array)
- `cta_text`
- `reveal_message`
- `branding` (primary color, button color, logo url)
- `survey_questions` (array, optional)
- `created_at`, `last_active_at`
- `status` (active / paused / archived)

### Lead
- `id`
- `simulation_id`
- `buyer_name`
- `buyer_email`
- `quantity`
- `total_price`
- `consented` (boolean)
- `survey_responses` (json, optional)
- `device_type`
- `utm_source`, `utm_medium`, `utm_campaign`
- `created_at`
- `step_reached` (enum: started / completed / abandoned)

---

## Legal & Compliance Requirements

### Non-Negotiable Platform Rules (enforced, not optional)
1. "Simulation" badge must appear on every buyer-facing page — cannot be removed or hidden by creator
2. Reveal page must fire before buyer is redirected anywhere — cannot be skipped
3. Opt-in to creator contact must be unchecked by default
4. No real card number input fields anywhere in the product
5. Platform privacy policy linked on every simulation page
6. All stored buyer data must be deletable on request

### Creator Obligations (agreed to at link creation)
- Creators agree they will not misrepresent the simulation as a real product purchase
- Creators agree to only contact buyers who opted in
- Creators agree to delete buyer data on request

### Regulatory Considerations
- GDPR: lawful basis for storing buyer data is consent (the opt-in checkbox). Data deletion must be honored within 30 days.
- CCPA: California buyers have the right to know what's collected and request deletion. Privacy notice on page satisfies disclosure requirement.
- CAN-SPAM: Creator follow-up emails must include unsubscribe. Platform should surface this in creator guidance.

---

## Monetization

| Tier | Price | Limits |
|---|---|---|
| Free | $0 | 1 active simulation, 50 leads/mo, PayFlow branding |
| Pro | $29/mo | Unlimited simulations, A/B testing, custom domain, 1,000 leads/mo, CSV export, integrations |
| Agency | $99/mo | Everything in Pro + white-label, team seats, client management, unlimited leads |

Upgrade prompts trigger contextually — when free user hits lead limit, when they try to access A/B testing, when they want custom domain.

---

## Success Metrics

- **Activation:** % of visitors who create and share a simulation link (target: >40%)
- **Retention:** % of creators who return to their dashboard within 7 days (target: >60%)
- **Conversion:** % of free users who upgrade within 30 days of hitting a limit (target: >15%)
- **Data quality:** % of simulations with >10 leads (proxy for creator success)

---

## Out of Scope (V1)

- Real payment processing
- Native mobile app
- Multi-language support
- Advanced analytics (heatmaps, session replay)
- API access
