import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { login } from '../../shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const errors = loginErrorMessage(await login(request));
  return { errors };
}

export async function action({ request }: ActionFunctionArgs) {
  const errors = loginErrorMessage(await login(request));
  return { errors };
}

function loginErrorMessage(loginErrors: { shop?: string } | null) {
  if (loginErrors?.shop === 'MISSING_SHOP') {
    return { shop: 'Please enter your shop domain to log in.' };
  }
  if (loginErrors?.shop === 'INVALID_SHOP') {
    return { shop: 'Please enter a valid shop domain.' };
  }
  return {};
}
