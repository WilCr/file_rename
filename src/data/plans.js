const PRICE_PRO = import.meta.env.VITE_STRIPE_PRICE_PRO || ''
const PRICE_BUSINESS = import.meta.env.VITE_STRIPE_PRICE_BUSINESS || ''

export const paidPlansReady = Boolean(PRICE_PRO && PRICE_BUSINESS)

export const PLANS = [
  {
    name: 'Free',
    price: '$0',
    credits: '10 renames / month',
    features: [
      '10 AI-powered renames per month',
      'Basic pattern renaming',
      'Owner name labeling',
    ],
    priceId: null,
  },
  {
    name: 'Pro',
    price: '$8.99',
    credits: '200 renames / month',
    features: [
      '200 AI-powered renames per month',
      'All pattern options',
      'Priority processing',
      'Batch operations',
    ],
    priceId: PRICE_PRO || null,
    popular: true,
  },
  {
    name: 'Business',
    price: '$25.99',
    credits: '700 renames / month',
    features: [
      '700 AI-powered renames per month',
      'Same renaming tools as Pro (patterns, owner labels, batch AI)',
      'Reads PDFs, images, and Word documents for naming',
    ],
    priceId: PRICE_BUSINESS || null,
  },
]
