alter table public.certificate_recipients
  alter column cohort set default 'Blockchain Fundamentals 1';

update public.certificate_recipients
set
  cohort = 'Blockchain Fundamentals 1',
  updated_at = now()
where cohort = 'Cohort 1';
