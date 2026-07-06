
-- 1. Auto-grant admin role to owner email on signup + backfill existing user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.accounts (user_id, balance, buying_power) VALUES (NEW.id, 0, 0);
  INSERT INTO public.profiles (user_id, first_name, last_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
  INSERT INTO public.notifications (user_id, title, body)
    VALUES (NEW.id, 'Welcome to Robinhood', 'Your account is ready. Fund it to start investing.');
  IF lower(NEW.email) = 'jasonrayoliver@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $function$;

-- Ensure trigger exists (in case it wasn't set)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: if user already exists, grant admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'jasonrayoliver@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Admin read policies (view all users' data)
CREATE POLICY "Admins can view all deposit requests" ON public.deposit_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all accounts" ON public.accounts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd numeric NOT NULL CHECK (amount_usd > 0),
  method text NOT NULL,
  destination text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);
GRANT SELECT, INSERT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own withdrawals" ON public.withdrawal_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own withdrawals" ON public.withdrawal_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all withdrawals" ON public.withdrawal_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admin actions
CREATE OR REPLACE FUNCTION public.adjust_balance(_user_id uuid, _delta numeric, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.accounts
     SET balance = balance + _delta,
         buying_power = buying_power + _delta,
         updated_at = now()
   WHERE user_id = _user_id;
  INSERT INTO public.transactions (user_id, kind, label, sub, amount)
  VALUES (_user_id, CASE WHEN _delta >= 0 THEN 'deposit' ELSE 'withdrawal' END,
          'Admin adjustment', _reason, _delta);
  INSERT INTO public.notifications (user_id, title, body)
  VALUES (_user_id, 'Balance updated',
          'Your balance was ' || CASE WHEN _delta >= 0 THEN 'credited $' ELSE 'debited $' END || abs(_delta)::text || COALESCE(' — ' || _reason, '') || '.');
END; $$;

CREATE OR REPLACE FUNCTION public.confirm_withdrawal(_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.withdrawal_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO r FROM public.withdrawal_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND OR r.status <> 'pending' THEN RAISE EXCEPTION 'Invalid request'; END IF;
  UPDATE public.accounts
     SET balance = balance - r.amount_usd, buying_power = buying_power - r.amount_usd, updated_at = now()
   WHERE user_id = r.user_id;
  INSERT INTO public.transactions (user_id, kind, label, sub, amount)
  VALUES (r.user_id, 'withdrawal', 'Withdrawal', r.method || ' · ' || r.destination, -r.amount_usd);
  INSERT INTO public.notifications (user_id, title, body)
  VALUES (r.user_id, 'Withdrawal confirmed', 'Your withdrawal of $' || r.amount_usd::text || ' has been processed.');
  UPDATE public.withdrawal_requests SET status = 'confirmed', confirmed_at = now() WHERE id = _request_id;
END; $$;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(_request_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.withdrawal_requests
     SET status = 'rejected', note = COALESCE(_reason, note), confirmed_at = now()
   WHERE id = _request_id AND status = 'pending';
END; $$;
