import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
loadEnvConfig(process.cwd());
const db=new PrismaClient();
async function main(){
 const leads=await db.enquiry.findMany({include:{items:true,notes:{include:{user:{select:{name:true}}}},notification:true}});
 for(const e of leads){
   const status=({NEW:'New',CONTACTED:'Contacted',QUALIFIED:'Contacted',QUOTE_SENT:'Quoted',CONVERTED:'Closed',CLOSED:'Closed',SPAM:'Closed'} as const)[e.status];
   const body={p_data:{submission_id:e.requestId,created_at:e.createdAt,updated_at:e.updatedAt,name:e.name,company:e.company,email:e.email,phone:e.phone,quantity:e.quantity,city:e.city,budget:e.budget,occasion:e.occasion,message:e.message,consent_at:e.consentAt,selected_combo_id:e.items[0]?.productId||e.items[0]?.packageId||null,selected_combo_name:e.items.map(i=>i.nameSnapshot).join('; ')||null,source_page:e.source,status,utm:e.utm,legacy_id:e.id,legacy_status:e.status},p_activity:e.notes.map(n=>({actor_id:n.userId,actor_name:n.user.name,note:n.text,created_at:n.createdAt})),p_notification:{sent_at:e.notification?.sentAt||null,attempts:e.notification?.attempts||0,last_error:e.notification?.lastError||null}};
   const r=await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/geniekart_import_legacy`,{method:'POST',headers:{apikey:process.env.SUPABASE_SECRET_KEY||'','Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!r.ok) throw new Error(`Import failed: HTTP ${r.status}. No original records were changed.`);
 }
 console.log(`Preserved ${leads.length} local enquiry records in Supabase; originals retained. No notifications sent.`);
}
main().catch(()=>{console.error('Legacy import failed. Inspect configuration; original records remain intact.');process.exitCode=1;}).finally(()=>db.$disconnect());
