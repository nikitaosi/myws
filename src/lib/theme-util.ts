// const getSystemTheme = () => matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
// const setTheme = (value: string) => {
//   document.documentElement.className = value === "system" ? getSystemTheme() : value;
//   localStorage.setItem("theme", value);
// };
// const themeSwitch = document.getElementById("themeSwitch") as HTMLInputElement;
// const currentTheme = localStorage.getItem("theme");
// if (currentTheme) {
//   themeSwitch.value = currentTheme
//   setTheme(themeSwitch.value);
// }
// themeSwitch.addEventListener("change", (event) => setTheme((event.target as HTMLInputElement).value));
document.addEventListener('astro:page-load', () => {
  let checkbox: HTMLInputElement | null = document.querySelector("input[name=theme_switch]");
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme === "dark") checkbox!.checked = true;

  if (!currentTheme) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("class", "dark");
      localStorage.setItem("theme", "dark");
      checkbox!.checked = true;
    } else {
      document.documentElement.setAttribute("class", "light");
      localStorage.setItem("theme", "light");
      checkbox!.checked = false;
    }
  } else {
    document.documentElement.setAttribute("class", currentTheme);
  }

// switch theme if checkbox is engaged
  checkbox!.addEventListener("change", (cb) => {
    document.documentElement.setAttribute(
      "class",
      (cb.target as HTMLInputElement).checked ? "dark" : "light"
    );
    localStorage.setItem("theme", (cb.target as HTMLInputElement).checked ? "dark" : "light");
  });
});
