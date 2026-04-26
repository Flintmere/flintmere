import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  FormLayout,
  InlineStack,
  Layout,
  Link as PolarisLink,
  Page,
  Text,
  TextField,
} from '@shopify/polaris';
import { useEffect, useState } from 'react';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';

const PLAN_LABELS: Record<string, { label: string; price: string; tone: 'info' | 'success' | 'attention' | 'warning' }> = {
  free: { label: 'Free', price: '£0', tone: 'info' },
  growth: { label: 'Growth', price: '£79/mo', tone: 'success' },
  scale: { label: 'Scale', price: '£249/mo', tone: 'success' },
  agency: { label: 'Agency', price: '£499/mo', tone: 'success' },
  plus: { label: 'Plus', price: 'from £1,500/mo', tone: 'success' },
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
    select: {
      shopDomain: true,
      planTier: true,
      installedAt: true,
      countryCode: true,
      primaryDomain: true,
      notificationsEmail: true,
      weeklyDigestEnabled: true,
      driftAlertsEnabled: true,
      autoApplyTier1Enabled: true,
    },
  });

  if (!shop) {
    throw json({ message: 'Shop not found' }, { status: 404 });
  }

  return { shop };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const notificationsEmail = String(formData.get('notificationsEmail') ?? '').trim();
  const weeklyDigestEnabled = formData.get('weeklyDigestEnabled') === 'on';
  const driftAlertsEnabled = formData.get('driftAlertsEnabled') === 'on';
  const autoApplyTier1Enabled = formData.get('autoApplyTier1Enabled') === 'on';

  // Email is required only when any email channel is on.
  const wantsEmail = weeklyDigestEnabled || driftAlertsEnabled;
  if (wantsEmail && !isValidEmail(notificationsEmail)) {
    return json(
      { ok: false, code: 'invalid-email' as const },
      { status: 400 },
    );
  }

  await prisma.shop.update({
    where: { shopDomain: session.shop },
    data: {
      notificationsEmail: notificationsEmail || null,
      weeklyDigestEnabled,
      driftAlertsEnabled,
      autoApplyTier1Enabled,
    },
  });

  return json({ ok: true as const });
}

export default function Settings() {
  const { shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';

  const planMeta = PLAN_LABELS[shop.planTier] ?? PLAN_LABELS.free!;

  const [email, setEmail] = useState(shop.notificationsEmail ?? '');
  const [weekly, setWeekly] = useState(shop.weeklyDigestEnabled);
  const [drift, setDrift] = useState(shop.driftAlertsEnabled);
  const [autoApply, setAutoApply] = useState(shop.autoApplyTier1Enabled);

  // Reset local state when loader data refreshes (e.g. after a successful save).
  useEffect(() => {
    setEmail(shop.notificationsEmail ?? '');
    setWeekly(shop.weeklyDigestEnabled);
    setDrift(shop.driftAlertsEnabled);
    setAutoApply(shop.autoApplyTier1Enabled);
  }, [
    shop.notificationsEmail,
    shop.weeklyDigestEnabled,
    shop.driftAlertsEnabled,
    shop.autoApplyTier1Enabled,
  ]);

  return (
    <Page title="Settings" subtitle="Notifications, automation, plan, and data.">
      <Layout>
        {actionData?.ok ? (
          <Layout.Section>
            <Banner title="Settings saved" tone="success" />
          </Layout.Section>
        ) : null}
        {actionData && !actionData.ok ? (
          <Layout.Section>
            <Banner title="Could not save settings" tone="critical">
              <p>
                {actionData.code === 'invalid-email'
                  ? 'Enter a valid email address before enabling email notifications.'
                  : 'Unknown error.'}
              </p>
            </Banner>
          </Layout.Section>
        ) : null}

        <Layout.AnnotatedSection
          title="Plan"
          description="Your current Flintmere subscription. Upgrades unlock Tier 2 enrichment and faster bulk SLAs."
        >
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center">
                <Badge tone={planMeta.tone}>{planMeta.label}</Badge>
                <Text as="span" tone="subdued">{planMeta.price}</Text>
              </InlineStack>
              <Text as="p" tone="subdued" variant="bodySm">
                Installed {new Date(shop.installedAt).toLocaleDateString()} ·{' '}
                {shop.primaryDomain ?? shop.shopDomain}
              </Text>
              {shop.planTier === 'free' ? (
                <Box paddingBlockStart="200">
                  <Button variant="primary" url="https://flintmere.com/pricing" external>
                    [ View pricing ]
                  </Button>
                </Box>
              ) : null}
            </BlockStack>
          </Card>
        </Layout.AnnotatedSection>

        <Form method="post">
          <Layout.AnnotatedSection
            title="Notifications"
            description="Where Flintmere reaches you about score changes and weekly summaries. We never email you about another merchant."
          >
            <Card>
              <FormLayout>
                <TextField
                  label="Notification email"
                  type="email"
                  name="notificationsEmail"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  helpText="Leave empty to disable all email channels."
                />
                <Checkbox
                  label="Weekly digest"
                  name="weeklyDigestEnabled"
                  checked={weekly}
                  onChange={setWeekly}
                  helpText="Monday morning summary: score, top issues, fixes applied that week."
                />
                <Checkbox
                  label="Drift alerts"
                  name="driftAlertsEnabled"
                  checked={drift}
                  onChange={setDrift}
                  helpText="Email when your score drops more than 5 points or a critical issue appears."
                />
              </FormLayout>
            </Card>
          </Layout.AnnotatedSection>

          <Layout.AnnotatedSection
            title="Automation"
            description="Tier 1 fixes are reversible for 7 days from Fix history. Auto-apply runs them without merchant approval."
          >
            <Card>
              <BlockStack gap="200">
                <Checkbox
                  label="Auto-apply Tier 1 fixes"
                  name="autoApplyTier1Enabled"
                  checked={autoApply}
                  onChange={setAutoApply}
                  helpText="Off by default. When on, brand-from-vendor and other safe fixes apply automatically after each scan."
                />
                {autoApply ? (
                  <Banner tone="warning" title="Auto-apply is on">
                    <p>
                      Tier 1 fixes will run after every scan. You can still
                      revert any batch from <strong>Fix history</strong>{' '}
                      within 7 days.
                    </p>
                  </Banner>
                ) : null}
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>

          <Layout.Section>
            <InlineStack align="end">
              <Button submit variant="primary" loading={submitting}>
                Save settings
              </Button>
            </InlineStack>
          </Layout.Section>
        </Form>

        <Layout.AnnotatedSection
          title="Data"
          description="Export everything Flintmere holds about your shop, or read our privacy posture."
        >
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="200">
                <Button url="/app/fixes/export.csv" external>
                  Export fix history (CSV)
                </Button>
              </InlineStack>
              <Text as="p" tone="subdued" variant="bodySm">
                See our{' '}
                <PolarisLink url="https://flintmere.com/privacy" external>
                  Privacy Policy
                </PolarisLink>{' '}
                and{' '}
                <PolarisLink url="https://flintmere.com/dpa" external>
                  Data Processing Agreement
                </PolarisLink>{' '}
                for what we store and how to request deletion.
              </Text>
            </BlockStack>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          title="Uninstall"
          description="Removing the app from your store deletes all Flintmere data within 30 days, per our DPA."
        >
          <Card>
            <BlockStack gap="200">
              <Text as="p" tone="subdued" variant="bodySm">
                To uninstall: open Shopify admin → Apps → Flintmere → Uninstall.
                Your scoring history and applied fixes remain in your store
                (brand metafields, etc.) but will no longer update.
              </Text>
            </BlockStack>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}

function isValidEmail(value: string): boolean {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
