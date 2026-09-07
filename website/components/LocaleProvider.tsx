"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Locale, textFor, TextKey } from "@/lib/locale";
const Context = createContext<{locale: Locale; setLocale: (locale: Locale) => void}>({locale:"fa-AF",setLocale:()=>{}});
export function LocaleProvider({locale: initial, children}:{locale:Locale;children:React.ReactNode}) {
  const [locale, setLocaleState] = useState(initial);
  const router = useRouter();
  useEffect(()=>{setLocaleState(initial);},[initial]);
  useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==="en"?"ltr":"rtl";},[locale]);
  function setLocale(next:Locale) {
    document.cookie=`darmalton_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    flushSync(()=>setLocaleState(next));
    router.refresh();
  }
  return <Context.Provider value={{locale,setLocale}}>{children}</Context.Provider>;
}
export function useLocale(){const context=useContext(Context);const t=useCallback((key:TextKey)=>textFor(context.locale,key),[context.locale]);return {...context,t};}
