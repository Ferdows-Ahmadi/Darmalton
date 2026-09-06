import { cookies } from "next/headers";
import { validLocale } from "./locale";
export async function serverLocale() { return validLocale((await cookies()).get("darmalton_locale")?.value); }
