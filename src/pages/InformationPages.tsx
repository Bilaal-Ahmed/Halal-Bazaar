import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck, Store } from 'lucide-react';
import { Button } from '../../components/ui/button';

function PageLayout({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="font-semibold text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{intro}</p>
      <div className="prose prose-slate mt-8 max-w-none space-y-8">{children}</div>
    </article>
  );
}

export function AboutPage() {
  return (
    <PageLayout eyebrow="About" title="A marketplace for thoughtful shopping" intro="Halal-Bazaar provides a place for independent sellers to publish product listings and for shoppers to browse and place orders.">
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">How the marketplace works</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Sellers apply for access before they can manage a store. Approved sellers are responsible for their listings, stock, product descriptions, and order fulfillment. Buyers can browse listings, manage delivery addresses, and review order and payment status in their account.</p>
      </section>
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> Product and certification information</h2>
        <p className="mt-3 leading-7 text-muted-foreground">A seller's “Halal certified” listing label is a seller-provided claim. Halal-Bazaar does not currently independently verify certificates or certify products. Buyers should review seller-provided information and contact the seller or relevant certifier when they need confirmation.</p>
      </section>
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Store className="h-5 w-5 text-primary" /> Independent sellers</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Seller accounts require administrator review. Approval allows access to seller tools; it is not a guarantee of product quality, certification, delivery performance, or legal compliance. Marketplace payment and delivery options depend on the configuration shown at checkout.</p>
      </section>
      <Link to="/products"><Button className="gap-2">Explore listings <ArrowRight className="h-4 w-4" /></Button></Link>
    </PageLayout>
  );
}

const articles = [
  {
    slug: 'shopping-with-care',
    category: 'Buyer guide',
    title: 'A thoughtful checklist for shopping online',
    intro: 'A few practical checks can help you make a more informed purchase.',
    paragraphs: [
      'Read the full listing description and check the product options, seller information, and available stock before ordering.',
      'For questions about ingredients, sourcing, certification, or suitability, ask the seller for details and supporting information. A marketplace label is not a substitute for checking a certificate with its issuer.',
      'Review your delivery address and payment method before confirming checkout. Keep your order reference and use the order page to follow payment and fulfillment updates.',
    ],
  },
  {
    slug: 'seller-listing-basics',
    category: 'Seller guide',
    title: 'Creating clear and useful product listings',
    intro: 'Accurate descriptions help buyers understand what is being offered.',
    paragraphs: [
      'Use a specific product name, explain relevant characteristics and variations, and keep the listed price and stock count current.',
      'Only make certification or other product claims you can support. Be prepared to answer buyer questions and to provide appropriate documentation where applicable.',
      'Review new orders promptly and keep fulfillment statuses current so buyers can see progress.',
    ],
  },
  {
    slug: 'understanding-payment-status',
    category: 'Orders',
    title: 'Understanding marketplace payment statuses',
    intro: 'Checkout options and payment review status are different from an automated gateway payment.',
    paragraphs: [
      'Cash on delivery orders remain unpaid until the administrator records that cash has been received. This status is not a card or wallet authorization.',
      'Manual bank-transfer orders are marked for review. Keep your transfer reference and wait for an administrator to confirm or reject the transfer in the order status.',
      'JazzCash and Easypaisa checkout are not active in this application until their official merchant integrations and callbacks are implemented and verified.',
    ],
  },
];

export function BlogPage() {
  const { slug } = useParams();
  const article = articles.find(item => item.slug === slug);
  if (slug) {
    if (!article) {
      return <PageLayout eyebrow="Blog" title="Article not found" intro="That article is not available."><Link to="/blog" className="inline-flex items-center gap-2 text-primary"><ArrowLeft className="h-4 w-4" /> Back to the blog</Link></PageLayout>;
    }
    return (
      <PageLayout eyebrow={article.category} title={article.title} intro={article.intro}>
        {article.paragraphs.map(paragraph => <p key={paragraph} className="leading-7 text-muted-foreground">{paragraph}</p>)}
        <Link to="/blog" className="inline-flex items-center gap-2 text-primary"><ArrowLeft className="h-4 w-4" /> All articles</Link>
      </PageLayout>
    );
  }
  return (
    <PageLayout eyebrow="Guides & updates" title="Halal-Bazaar blog" intro="Practical notes for buyers and independent marketplace sellers.">
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map(item => (
          <Link key={item.slug} to={`/blog/${item.slug}`} className="rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md">
            <span className="text-sm font-semibold text-primary">{item.category}</span>
            <h2 className="mt-2 text-xl font-bold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.intro}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read article <ArrowRight className="h-4 w-4" /></span>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}

export function ContactPage() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim();
  return (
    <PageLayout eyebrow="Contact" title="How can we help?" intro="For account, order, seller application, or listing questions, contact the marketplace support team.">
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Mail className="h-5 w-5 text-primary" /> Support email</h2>
        {supportEmail ? (
          <p className="mt-3 leading-7 text-muted-foreground">Email <a className="font-semibold text-primary hover:underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>. For order issues, include your order reference, but never send passwords, one-time codes, or complete payment credentials.</p>
        ) : (
          <p className="mt-3 leading-7 text-muted-foreground">A support inbox has not been configured for this installation. The site operator should set the public <code>VITE_SUPPORT_EMAIL</code> value before launch. Until then, use the account and order pages for available self-service information.</p>
        )}
      </section>
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">Need an order update?</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Open your buyer dashboard or order details page to see payment and seller fulfillment status. A status in this app is not proof of payment settlement by a bank or payment provider.</p>
        <Link to="/dashboard"><Button variant="outline" className="mt-4">Open buyer dashboard</Button></Link>
      </section>
    </PageLayout>
  );
}

export function FaqPage() {
  const entries = [
    ['Can a seller account also be used to shop?', 'Yes. An approved seller can use the buyer dashboard, browse products, manage a cart, and view buyer orders. Seller tools are a separate workspace.'],
    ['Are listings independently certified by Halal-Bazaar?', 'No. Any certification label is supplied by the seller. Buyers should request evidence and verify it with the issuing organization when needed.'],
    ['Which payment methods are available?', 'Cash on delivery is available. Manual bank transfer is shown only when the operator configures instructions and remains pending until reviewed. JazzCash and Easypaisa are not enabled.'],
    ['How do I follow my order?', 'Sign in and open Buyer Dashboard → Order history. The order details page shows payment state and seller fulfillment updates.'],
    ['How do I apply to sell?', 'Sign in, open Profile, and submit the seller application. Seller tools become available only after administrator approval.'],
    ['What is the return or refund policy?', 'A return/refund workflow and a platform-wide policy have not been configured in this application. Contact the seller and marketplace operator before placing an order if you need those terms clarified.'],
    ['How do I delete my account?', 'There is no self-service account deletion feature in this version. Contact the configured support address to request assistance; order records may need to be retained for operational or legal reasons.'],
  ];
  return (
    <PageLayout eyebrow="Help center" title="Frequently asked questions" intro="Answers about using the marketplace as a buyer or seller.">
      {entries.map(([question, answer]) => (
        <section key={question} className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-bold">{question}</h2>
          <p className="mt-2 leading-7 text-muted-foreground">{answer}</p>
        </section>
      ))}
    </PageLayout>
  );
}

export function PrivacyPage() {
  return (
    <PageLayout eyebrow="Legal information" title="Privacy policy" intro="This notice describes data handled by the current Halal-Bazaar application. The operator should review it for the laws and services applicable to the deployed marketplace before launch.">
      <p className="text-sm text-amber-800">Operator review required: this product notice is not legal advice and does not replace a jurisdiction-specific privacy assessment.</p>
      <section><h2 className="text-xl font-bold">Information processed</h2><p className="mt-2 leading-7 text-muted-foreground">Firebase Authentication processes sign-in identifiers and authentication state. The marketplace stores account profile details and saved delivery addresses in Firestore. Seller applications and store information are stored for review and marketplace operations. When you place an order, the server stores the item and price snapshot, quantities, delivery address, payment method, transfer reference when supplied, and order status. Administrator actions generate audit records.</p></section>
      <section><h2 className="text-xl font-bold">Shopping cart and assistant</h2><p className="mt-2 leading-7 text-muted-foreground">The shopping cart is held in browser storage. Messages you send to the optional assistant are sent to Google Gemini through the application server. The application does not save chat history in its marketplace database; Google processes submitted prompts under its own terms and policies. Do not include passwords, payment details, or sensitive personal information in assistant messages.</p></section>
      <section><h2 className="text-xl font-bold">Purpose and access</h2><p className="mt-2 leading-7 text-muted-foreground">Information is used to authenticate users, provide buyer and seller features, create and fulfill orders, review payments and applications, prevent unauthorized access, and maintain service operations. Buyers can view their own orders; sellers receive order information needed for orders containing their listings; administrators have privileged access for moderation and support. Infrastructure providers such as Firebase/Google may process data to provide configured services.</p></section>
      <section><h2 className="text-xl font-bold">Retention, security, and requests</h2><p className="mt-2 leading-7 text-muted-foreground">Data is retained in the configured Firebase project and server environment until removed by the operator or as otherwise required for marketplace operations. The application uses authentication, access rules, and server-side authorization, but no internet service can guarantee absolute security. This version has no self-service account deletion. Use the Contact page to reach support if configured, and the operator should publish a verified contact route before launch.</p></section>
      <p className="text-sm text-muted-foreground">Last updated: October 14, 2026.</p>
    </PageLayout>
  );
}

export function TermsPage() {
  return (
    <PageLayout eyebrow="Legal information" title="Terms of service" intro="These draft terms summarize current application behavior. The marketplace operator should obtain legal review and publish final terms before accepting real customers.">
      <p className="text-sm text-amber-800">Draft for operator review; not legal advice. Local consumer, privacy, tax, and marketplace laws may require additional terms.</p>
      <section><h2 className="text-xl font-bold">Marketplace and accounts</h2><p className="mt-2 leading-7 text-muted-foreground">Halal-Bazaar provides software for independent sellers to publish listings and buyers to submit orders. You must provide accurate account information, protect your sign-in credentials, and use the service lawfully. The operator may restrict accounts that violate marketplace requirements.</p></section>
      <section><h2 className="text-xl font-bold">Seller listings</h2><p className="mt-2 leading-7 text-muted-foreground">Sellers are responsible for listing accuracy, lawful sale, price and inventory accuracy, support, and fulfillment. A seller-provided halal or certification label is not independently verified by the platform. Seller approval is access to marketplace tools, not an endorsement or certification.</p></section>
      <section><h2 className="text-xl font-bold">Orders and payment</h2><p className="mt-2 leading-7 text-muted-foreground">Order prices, stock, tax configuration, and currency are checked by the server at checkout. Cash-on-delivery orders remain unpaid until recorded as received. Manual transfers require administrator review. JazzCash and Easypaisa are not active in this application; no order should be treated as paid through those gateways.</p></section>
      <section><h2 className="text-xl font-bold">Delivery, cancellation, returns, and support</h2><p className="mt-2 leading-7 text-muted-foreground">Seller fulfillment updates are shown as supplied by sellers. A complete platform-wide cancellation, returns, and refunds workflow has not been implemented. The operator must publish applicable delivery, cancellation, and refund terms and configure a support contact before launch. Do not rely on this draft as a substitute for those policies.</p></section>
      <section><h2 className="text-xl font-bold">Changes and contact</h2><p className="mt-2 leading-7 text-muted-foreground">The operator may update the service and these terms. Continued use after final terms are published is subject to those terms. Contact information is available on the Contact page when configured.</p></section>
      <p className="text-sm text-muted-foreground">Last updated: October 14, 2026.</p>
    </PageLayout>
  );
}
