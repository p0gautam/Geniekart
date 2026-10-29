-- Existing Geniekart staff authenticate in Next.js. Only its server secret may
-- execute these functions. No Supabase Auth user receives enquiry access.
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (length(btrim(name)) between 2 and 250),
  company text not null check (length(btrim(company)) between 2 and 250),
  email text not null check (length(email) between 3 and 254 and email like '%@%'),
  phone text not null check (length(phone) between 8 and 20),
  quantity integer not null check (quantity between 1 and 10000000),
  city text check (length(city)<=250), budget text check (length(budget)<=250),
  occasion text check (length(occasion)<=250), message text check (length(message)<=12000),
  consent boolean not null check (consent), consent_at timestamptz not null default now(),
  selected_combo_id text check (length(selected_combo_id)<=250),
  selected_combo_name text check (length(selected_combo_name)<=250),
  source_page text not null check (length(source_page)<=2000),
  status text not null default 'New' check (status in ('New','Contacted','Quoted','Closed')),
  utm jsonb not null default '{}',
  legacy_id text unique,
  legacy_status text
);
create index enquiries_created_idx on public.enquiries(created_at desc, id);
create index enquiries_status_created_idx on public.enquiries(status,created_at desc);
create index enquiries_occasion_idx on public.enquiries(occasion);
create table public.enquiry_activity (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('received','status_changed','note_added','legacy_import')),
  actor_id text, actor_name text,
  previous_status text, new_status text, note text check (length(note)<=5000),
  source_page text, selected_combo_name text,
  operation_id uuid,
  unique(enquiry_id,operation_id,kind)
);
create index enquiry_activity_enquiry_idx on public.enquiry_activity(enquiry_id,created_at desc);
create table public.enquiry_rate_limits (
  key text primary key, count integer not null, expires_at timestamptz not null
);
create table public.enquiry_notifications (
  enquiry_id uuid primary key references public.enquiries(id),
  sent_at timestamptz, attempts integer not null default 0,
  last_error text, locked_until timestamptz
);
alter table public.enquiries enable row level security;
alter table public.enquiry_activity enable row level security;
alter table public.enquiry_rate_limits enable row level security;
alter table public.enquiry_notifications enable row level security;
revoke all on public.enquiries,public.enquiry_activity,public.enquiry_rate_limits,public.enquiry_notifications from public,anon,authenticated;
grant select,insert,update on public.enquiries,public.enquiry_activity,public.enquiry_rate_limits,public.enquiry_notifications to service_role;

create function public.geniekart_receive(p_data jsonb, p_rate_key text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare e public.enquiries; n integer;
begin
  -- Serialize concurrent retries of the same submission before rate limiting.
  perform pg_advisory_xact_lock(hashtextextended(p_data->>'submission_id',0));
  select * into e from public.enquiries where submission_id=(p_data->>'submission_id')::uuid;
  if found then return jsonb_build_object('id',e.id,'duplicate',true); end if;
  insert into public.enquiry_rate_limits(key,count,expires_at) values(p_rate_key,1,now()+interval '1 hour')
  on conflict(key) do update set count=case when enquiry_rate_limits.expires_at<now() then 1 else enquiry_rate_limits.count+1 end,
    expires_at=case when enquiry_rate_limits.expires_at<now() then now()+interval '1 hour' else enquiry_rate_limits.expires_at end
  returning count into n;
  if n>15 then return jsonb_build_object('limited',true); end if;
  insert into public.enquiries(submission_id,name,company,email,phone,quantity,city,budget,occasion,message,consent,selected_combo_id,selected_combo_name,source_page,utm)
  values((p_data->>'submission_id')::uuid,p_data->>'name',p_data->>'company',p_data->>'email',p_data->>'phone',(p_data->>'quantity')::integer,
    nullif(p_data->>'city',''),nullif(p_data->>'budget',''),nullif(p_data->>'occasion',''),nullif(p_data->>'message',''),
    (p_data->>'consent')::boolean,p_data->>'selected_combo_id',p_data->>'selected_combo_name',p_data->>'source_page',coalesce(p_data->'utm','{}')) returning * into e;
  insert into public.enquiry_activity(enquiry_id,kind,source_page,selected_combo_name,new_status)
    values(e.id,'received',e.source_page,e.selected_combo_name,'New');
  insert into public.enquiry_notifications(enquiry_id) values(e.id);
  return jsonb_build_object('id',e.id,'duplicate',false);
end $$;

create function public.geniekart_list(p_search text default '', p_status text default '', p_occasion text default '', p_from date default null, p_to date default null, p_page integer default 1, p_size integer default 20)
returns jsonb language sql stable security invoker set search_path = '' as $$
with filtered as (
  select * from public.enquiries e
  where (p_search='' or strpos(lower(e.name||' '||e.company||' '||e.email||' '||e.phone),lower(p_search))>0)
    and (p_status='' or e.status=p_status) and (p_occasion='' or e.occasion=p_occasion)
    and (p_from is null or e.created_at >= p_from::timestamp at time zone 'UTC')
    and (p_to is null or e.created_at < (p_to+1)::timestamp at time zone 'UTC')
), page_rows as (
  select * from filtered order by created_at desc,id limit least(greatest(p_size,1),100) offset (greatest(p_page,1)-1)*least(greatest(p_size,1),100)
)
select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(r)) from page_rows r),'[]'),
  'total',(select count(*) from filtered),
  'counts',(select jsonb_build_object('New',count(*) filter(where status='New'),'Contacted',count(*) filter(where status='Contacted'),'Quoted',count(*) filter(where status='Quoted'),'Closed',count(*) filter(where status='Closed')) from filtered),
  'occasions',coalesce((select jsonb_agg(occasion order by occasion) from (select distinct occasion from public.enquiries where occasion is not null) o),'[]'));
$$;

create function public.geniekart_detail(p_id uuid) returns jsonb language sql stable security invoker set search_path = '' as $$
 select to_jsonb(e)||jsonb_build_object('activity',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc,a.id) from public.enquiry_activity a where a.enquiry_id=e.id),'[]'),
 'notification',(select to_jsonb(n)-'locked_until' from public.enquiry_notifications n where n.enquiry_id=e.id)) from public.enquiries e where e.id=p_id;
$$;

create function public.geniekart_update(p_id uuid,p_status text,p_note text,p_actor_id text,p_actor_name text,p_operation uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare e public.enquiries;
begin
 if p_status not in ('New','Contacted','Quoted','Closed') or length(p_note)>5000 or nullif(p_actor_id,'') is null or nullif(p_actor_name,'') is null then raise exception 'Invalid update'; end if;
 select * into e from public.enquiries where id=p_id for update;
 if not found then return null; end if;
 if exists(select 1 from public.enquiry_activity where enquiry_id=p_id and operation_id=p_operation) then return public.geniekart_detail(p_id); end if;
 if e.status<>p_status then
   update public.enquiries set status=p_status,updated_at=now() where id=p_id;
   insert into public.enquiry_activity(enquiry_id,kind,actor_id,actor_name,previous_status,new_status,operation_id)
     values(p_id,'status_changed',p_actor_id,p_actor_name,e.status,p_status,p_operation);
 end if;
 if nullif(btrim(p_note),'') is not null then
   insert into public.enquiry_activity(enquiry_id,kind,actor_id,actor_name,note,operation_id) values(p_id,'note_added',p_actor_id,p_actor_name,btrim(p_note),p_operation);
   update public.enquiries set updated_at=now() where id=p_id;
 end if;
 return public.geniekart_detail(p_id);
end $$;

create function public.geniekart_claim_notification(p_id uuid) returns boolean language sql security invoker set search_path = '' as $$
 with claimed as (update public.enquiry_notifications set locked_until=now()+interval '5 minutes',attempts=attempts+1
 where enquiry_id=p_id and sent_at is null and attempts<10 and (locked_until is null or locked_until<now()) returning enquiry_id)
 select exists(select 1 from claimed);
$$;

revoke all on function public.geniekart_receive(jsonb,text),public.geniekart_list(text,text,text,date,date,integer,integer),public.geniekart_detail(uuid),public.geniekart_update(uuid,text,text,text,text,uuid),public.geniekart_claim_notification(uuid) from public,anon,authenticated;
grant execute on function public.geniekart_receive(jsonb,text),public.geniekart_list(text,text,text,date,date,integer,integer),public.geniekart_detail(uuid),public.geniekart_update(uuid,text,text,text,text,uuid),public.geniekart_claim_notification(uuid) to service_role;
