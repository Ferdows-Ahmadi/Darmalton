"use client";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { TextKey } from "@/lib/locale";
export function Icon({name,size=24}:{name:string;size?:number}) { return <Image src={`/icons/${name}.webp`} alt="" width={size} height={size} aria-hidden="true"/>; }
export function PageTitle({title,subtitle}:{title:TextKey;subtitle?:TextKey}) { const {t}=useLocale();return <div className="page-heading"><div className="wrap"><div className="crumb"><Link href="/">{t("home")}</Link><span aria-hidden="true"> / </span><span>{t(title)}</span></div><h1>{t(title)}</h1>{subtitle&&<p>{t(subtitle)}</p>}</div></div>; }
export function State({kind="empty",title,body, retry}:{kind?:string;title:TextKey;body?:TextKey;retry?:()=>void}){const {t}=useLocale();return <div className={`state ${kind}`} role={kind==="error"?"alert":"status"}><span className="state-symbol" aria-hidden="true">{kind==="error"?"!":"+"}</span><h2>{t(title)}</h2>{body&&<p>{t(body)}</p>}{retry?<button onClick={retry}>{t("retry")}</button>:<Link className="button" href="/shop">{t("continueShopping")}</Link>}</div>;}
export function Loading(){const {t}=useLocale();return <p className="loading" role="status">{t("loading")}</p>;}
export function ErrorNotice({message}:{message:string}){return message?<p className="form-error" role="alert">{message}</p>:null;}
