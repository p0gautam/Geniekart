-- Server-only idempotent import; original local rows remain untouched.
create function public.geniekart_import_legacy(p_data jsonb,p_activity jsonb,p_notification jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare e public.enquiries; a jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_data->>'legacy_id',1));
 select * into e from public.enquiries where legacy_id=p_data->>'legacy_id';
 if found then return e.id; end if;
 insert into public.enquiries(submission_id,created_at,updated_at,name,company,email,phone,quantity,city,budget,occasion,message,consent,consent_at,selected_combo_id,selected_combo_name,source_page,status,utm,legacy_id,legacy_status)
 values((p_data->>'submission_id')::uuid,(p_data->>'created_at')::timestamptz,(p_data->>'updated_at')::timestamptz,p_data->>'name',p_data->>'company',p_data->>'email',p_data->>'phone',(p_data->>'quantity')::integer,
 p_data->>'city',p_data->>'budget',p_data->>'occasion',p_data->>'message',true,(p_data->>'consent_at')::timestamptz,p_data->>'selected_combo_id',p_data->>'selected_combo_name',p_data->>'source_page',p_data->>'status',p_data->'utm',p_data->>'legacy_id',p_data->>'legacy_status') returning * into e;
 insert into public.enquiry_activity(enquiry_id,kind,created_at,source_page,selected_combo_name,new_status) values(e.id,'received',e.created_at,e.source_page,e.selected_combo_name,'New');
 insert into public.enquiry_activity(enquiry_id,kind,note) values(e.id,'legacy_import','Imported from the existing local enquiry store. Original record retained.');
 for a in select value from jsonb_array_elements(p_activity) loop
   insert into public.enquiry_activity(enquiry_id,kind,actor_id,actor_name,note,created_at) values(e.id,'note_added',a->>'actor_id',a->>'actor_name',a->>'note',(a->>'created_at')::timestamptz);
 end loop;
 insert into public.enquiry_notifications(enquiry_id,sent_at,attempts,last_error) values(e.id,(p_notification->>'sent_at')::timestamptz,coalesce((p_notification->>'attempts')::integer,0),p_notification->>'last_error');
 return e.id;
end $$;
revoke all on function public.geniekart_import_legacy(jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.geniekart_import_legacy(jsonb,jsonb,jsonb) to service_role;
