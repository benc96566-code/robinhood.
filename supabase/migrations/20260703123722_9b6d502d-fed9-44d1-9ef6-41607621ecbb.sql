
-- Accounts: read-only for owner
DROP POLICY IF EXISTS "own account" ON public.accounts;
CREATE POLICY "own account read" ON public.accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Orders: read-only for owner (writes via SECURITY DEFINER RPCs)
DROP POLICY IF EXISTS "own orders" ON public.orders;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Transactions: read-only for owner
DROP POLICY IF EXISTS "own tx" ON public.transactions;
CREATE POLICY "own tx read" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_roles: block all client writes; only service_role/admin can modify.
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lock down SECURITY DEFINER functions from anon; restrict admin ones to service_role only.
REVOKE ALL ON FUNCTION public.confirm_deposit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_deposit(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_due_sells() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_deposit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_deposit(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_due_sells() TO service_role;

REVOKE ALL ON FUNCTION public.place_buy_order(text, numeric, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.place_sell_order(text, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_buy_order(text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_sell_order(text, numeric, numeric) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
