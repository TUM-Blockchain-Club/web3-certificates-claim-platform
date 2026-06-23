revoke all on table public.certificate_public_verifications from anon, authenticated;
revoke all on table public.certificate_public_verifications from service_role;

grant select on table public.certificate_public_verifications to service_role;

