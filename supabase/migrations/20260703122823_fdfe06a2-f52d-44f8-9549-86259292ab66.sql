-- ============================================
-- 1) User roles (admin gating for deposit confirmation)
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- 2) Deposit requests (pending -> confirmed by admin)
-- ============================================
CREATE TABLE public.deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin text NOT NULL,
  network text NOT NULL,
  amount_crypto numeric NOT NULL CHECK (amount_crypto > 0),
  amount_usd numeric NOT NULL CHECK (amount_usd > 0),
  deposit_address text NOT NULL,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

GRANT SELECT, INSERT ON public.deposit_requests TO authenticated;
GRANT ALL ON public.deposit_requests TO service_role;

ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own deposit requests"
  ON public.deposit_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users read own deposit requests"
  ON public.deposit_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update deposit requests"
  ON public.deposit_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 3) Orders: add fill_at for scheduled sell fills
-- ============================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fill_at timestamptz,
  ADD COLUMN IF NOT EXISTS filled_at timestamptz;

-- ============================================
-- 4) Server-side confirm_deposit (admin only)
--    Credits balance + logs transaction + marks request confirmed
-- ============================================
CREATE OR REPLACE FUNCTION public.confirm_deposit(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.deposit_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO r FROM public.deposit_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Deposit already processed'; END IF;

  UPDATE public.accounts
     SET balance = balance + r.amount_usd,
         buying_power = buying_power + r.amount_usd,
         updated_at = now()
   WHERE user_id = r.user_id;

  INSERT INTO public.transactions (user_id, kind, label, sub, amount)
  VALUES (r.user_id, 'deposit', 'Crypto deposit', r.coin || ' · ' || r.network, r.amount_usd);

  INSERT INTO public.notifications (user_id, title, body)
  VALUES (r.user_id, 'Deposit confirmed',
          'Your ' || r.coin || ' deposit of $' || r.amount_usd::text || ' has been credited.');

  UPDATE public.deposit_requests
     SET status = 'confirmed', confirmed_at = now()
   WHERE id = _request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_deposit(_request_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.deposit_requests
     SET status = 'rejected', note = COALESCE(_reason, note), confirmed_at = now()
   WHERE id = _request_id AND status = 'pending';
END;
$$;

-- ============================================
-- 5) place_buy_order — server-side balance check + instant fill
-- ============================================
CREATE OR REPLACE FUNCTION public.place_buy_order(
  _symbol text, _quantity numeric, _price numeric
) RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cost numeric := _quantity * _price;
  acct public.accounts%ROWTYPE;
  new_order public.orders%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _quantity <= 0 OR _price <= 0 THEN RAISE EXCEPTION 'Invalid order'; END IF;

  SELECT * INTO acct FROM public.accounts WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF acct.buying_power < cost THEN
    RAISE EXCEPTION 'Insufficient funds: need $%, have $%', cost, acct.buying_power;
  END IF;

  UPDATE public.accounts
     SET balance = balance - cost,
         buying_power = buying_power - cost,
         updated_at = now()
   WHERE user_id = uid;

  INSERT INTO public.orders (user_id, symbol, side, quantity, price, status, filled_at)
  VALUES (uid, upper(_symbol), 'buy', _quantity, _price, 'filled', now())
  RETURNING * INTO new_order;

  INSERT INTO public.transactions (user_id, kind, label, sub, symbol, quantity, amount)
  VALUES (uid, 'trade', 'Bought ' || upper(_symbol), _quantity::text || ' shares', upper(_symbol), _quantity, -cost);

  RETURN new_order;
END;
$$;

-- ============================================
-- 6) place_sell_order — check holdings, schedule 1-24h fill
-- ============================================
CREATE OR REPLACE FUNCTION public.place_sell_order(
  _symbol text, _quantity numeric, _price numeric
) RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  held numeric;
  new_order public.orders%ROWTYPE;
  delay_seconds int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _quantity <= 0 OR _price <= 0 THEN RAISE EXCEPTION 'Invalid order'; END IF;

  -- current holdings = sum(buy filled) - sum(sell filled + sell pending)
  SELECT COALESCE(SUM(CASE
    WHEN side = 'buy' AND status = 'filled' THEN quantity
    WHEN side = 'sell' AND status IN ('filled','pending') THEN -quantity
    ELSE 0 END), 0)
    INTO held
    FROM public.orders
   WHERE user_id = uid AND symbol = upper(_symbol);

  IF held < _quantity THEN
    RAISE EXCEPTION 'Insufficient shares: holding %, trying to sell %', held, _quantity;
  END IF;

  delay_seconds := 3600 + floor(random() * (23 * 3600))::int; -- 1h to 24h

  INSERT INTO public.orders (user_id, symbol, side, quantity, price, status, fill_at)
  VALUES (uid, upper(_symbol), 'sell', _quantity, _price, 'pending', now() + (delay_seconds || ' seconds')::interval)
  RETURNING * INTO new_order;

  RETURN new_order;
END;
$$;

-- ============================================
-- 7) process_due_sells — called by pg_cron every 5 minutes
-- ============================================
CREATE OR REPLACE FUNCTION public.process_due_sells()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.orders%ROWTYPE;
  proceeds numeric;
  count_filled int := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.orders
    WHERE side = 'sell' AND status = 'pending' AND fill_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    proceeds := r.quantity * r.price;
    UPDATE public.accounts
       SET balance = balance + proceeds,
           buying_power = buying_power + proceeds,
           updated_at = now()
     WHERE user_id = r.user_id;
    UPDATE public.orders SET status = 'filled', filled_at = now() WHERE id = r.id;
    INSERT INTO public.transactions (user_id, kind, label, sub, symbol, quantity, amount)
    VALUES (r.user_id, 'trade', 'Sold ' || r.symbol, r.quantity::text || ' shares', r.symbol, r.quantity, proceeds);
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (r.user_id, 'Sell order filled',
            'Your sell order for ' || r.quantity::text || ' ' || r.symbol || ' filled for $' || proceeds::text || '.');
    count_filled := count_filled + 1;
  END LOOP;
  RETURN count_filled;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_deposit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_deposit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_buy_order(text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_sell_order(text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_due_sells() TO service_role;

-- ============================================
-- 8) pg_cron: process pending sells every 5 minutes
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'process-due-sells',
  '*/5 * * * *',
  $cron$ SELECT public.process_due_sells(); $cron$
);