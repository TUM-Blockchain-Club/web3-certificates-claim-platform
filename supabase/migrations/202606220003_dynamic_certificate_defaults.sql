alter table public.certificate_recipients
  alter column certificate_issued_on set default current_date;

