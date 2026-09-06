import { Catalogue } from "@/components/Catalogue";
import { PageTitle, State } from "@/components/StoreUI";
import { publicApi } from "@/lib/server-api";
import type { Category, Medicine, PageResult } from "@/lib/types";
export default async function ShopPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const params=await searchParams;const q=new URLSearchParams();for(const key of ["search","category","manufacturer","page","ordering","in_stock","prescription_required","min_price","max_price"])if(params[key])q.set(key,params[key]!);const data=await Promise.all([publicApi<Category[]>("categories/"),publicApi<PageResult<Medicine>>(`medicines/?${q}`)]).catch(()=>null);return <><PageTitle title="shop"/><section className="page-section">{data?<Catalogue categories={data[0]} medicines={data[1]}/>:<State kind="error" title="unavailable" body="connection"/>}</section></>;}
