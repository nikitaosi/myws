
import { getCookie, setCookie } from "./helpers";
document.addEventListener('astro:page-load', () => {
  const checkbox = document.querySelector("input[name=theme_switch]") as HTMLInputElement;
  if (!checkbox) return;

  const currentTheme = getCookie("theme") === "dark" ? "dark" : "light";
  document.documentElement.className = currentTheme;
  checkbox.checked = currentTheme === "dark";
  checkbox.addEventListener('change', () => {
    const newTheme = checkbox.checked ? 'dark' : 'light';
    setCookie('theme', newTheme);
    document.documentElement.className = newTheme;
  });
});
