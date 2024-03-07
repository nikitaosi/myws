
import { getCookie, setCookie } from "./helpers";
document.addEventListener('astro:page-load', () => {
  const checkbox = document.querySelector("input[name=theme_switch]") as HTMLInputElement;
  const currentTheme = getCookie("theme");
  document.documentElement.setAttribute("class", currentTheme!);
  checkbox!.checked = currentTheme === "dark";
  checkbox!.addEventListener('change', () => {
    const newTheme = checkbox!.checked ? 'dark' : 'light';
    setCookie('theme', newTheme);
    document.documentElement.className = newTheme;
  });
});

