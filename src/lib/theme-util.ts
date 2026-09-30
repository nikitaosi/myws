
import { getCookie, setCookie } from "./helpers";
function initializeTheme() {
  const checkbox = document.querySelector("input[name=theme_switch]") as HTMLInputElement;
  if (!checkbox) return;

  const currentTheme = getCookie("theme") === "dark" ? "dark" : "light";
  document.documentElement.className = currentTheme;
  checkbox.checked = currentTheme === "dark";
  checkbox.onchange = () => {
    const newTheme = checkbox.checked ? 'dark' : 'light';
    setCookie('theme', newTheme);
    document.documentElement.className = newTheme;
  };
}

document.addEventListener('astro:page-load', initializeTheme);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTheme, {once: true});
} else {
  initializeTheme();
}
