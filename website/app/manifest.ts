import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Darmalton",
    short_name: "Darmalton",
    description: "داروخانه آنلاین درملتون",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#079b98",
    lang: "fa-AF",
    dir: "rtl",
    icons: [
      {
        src: "/icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
