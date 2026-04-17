-- Add e-signature fields to contracts table
alter table public.contracts
  add column signing_status text not null default '未發送'
    check (signing_status in ('未發送', '待簽署', '已簽署', '已拒絕')),
  add column signing_token uuid unique,
  add column signing_token_expires_at timestamptz,
  add column signed_at timestamptz,
  add column signer_ip text,
  add column signer_name text;

create index idx_contracts_signing_token on public.contracts(signing_token);

-- Allow public (anon) to read contract by token for the signing page
create policy "Public can read contract by signing token"
  on public.contracts for select to anon
  using (signing_token is not null);

-- Allow public (anon) to update signing fields when signing
create policy "Public can sign contract by token"
  on public.contracts for update to anon
  using (signing_token is not null and signing_status = '待簽署')
  with check (signing_status in ('已簽署', '已拒絕'));
