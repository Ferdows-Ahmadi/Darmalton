"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Locale, textFor, TextKey } from "@/lib/locale";
const Context = createContext<{locale: Locale; setLocale: (locale: Locale) => void}>({locale:"fa-AF",setLocale:()=>{}});
export function LocaleProvider({locale: initial, children}:{locale:Locale;children:React.ReactNode}) {
  const [locale,set] = useState(initial); const router=useRouter();
  useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==="en"?"ltr":"rtl";},[locale]);
  function setLocale(next:Locale) { set(next); document.cookie=`darmalton_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`; router.refresh(); }
  return <Context.Provider value={{locale,setLocale}}>{children}</Context.Provider>;
}
export function useLocale(){const context=useContext(Context);return {...context,t:(key:TextKey)=>textFor(context.locale,key)};}
