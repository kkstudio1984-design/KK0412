-- Audit log trigger function
create or replace function public.handle_audit_log()
returns trigger as $$
declare
  tracked_fields text[];
  field_name text;
  old_val text;
  new_val text;
begin
  -- Define tracked fields per table
  case TG_TABLE_NAME
    when 'contracts' then tracked_fields := array['monthly_rent', 'payment_cycle', 'deposit_amount', 'deposit_status'];
    when 'payments' then tracked_fields := array['status', 'amount'];
    when 'kyc_checks' then tracked_fields := array['status', 'override_reason'];
    when 'organizations' then tracked_fields := array['tax_id', 'contact_name', 'name', 'representative_address'];
    when 'space_clients' then tracked_fields := array['stage', 'is_high_risk_kyc', 'blacklist_flag'];
    else return new;
  end case;

  foreach field_name in array tracked_fields loop
    execute format('select ($1).%I::text, ($2).%I::text', field_name, field_name)
      into old_val, new_val
      using old, new;

    if old_val is distinct from new_val then
      insert into public.audit_logs (user_id, table_name, record_id, field_name, old_value, new_value)
      values (auth.uid(), TG_TABLE_NAME, new.id, field_name, old_val, new_val);
    end if;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger audit_contracts
  after update on public.contracts
  for each row execute function public.handle_audit_log();

create trigger audit_payments
  after update on public.payments
  for each row execute function public.handle_audit_log();

create trigger audit_kyc_checks
  after update on public.kyc_checks
  for each row execute function public.handle_audit_log();

create trigger audit_organizations
  after update on public.organizations
  for each row execute function public.handle_audit_log();

create trigger audit_space_clients
  after update on public.space_clients
  for each row execute function public.handle_audit_log();
