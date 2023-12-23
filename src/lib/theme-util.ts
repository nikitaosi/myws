const getSystemTheme = () => matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
const setTheme = (value: string) => {
  document.documentElement.className = value === "system" ? getSystemTheme() : value;
  localStorage.setItem("theme", value);
};
const themeSwitch = document.getElementById("themeSwitch") as HTMLSelectElement;
const currentTheme = localStorage.getItem("theme");
if (currentTheme) {
  themeSwitch.value = currentTheme
  setTheme(themeSwitch.value);
}
themeSwitch.addEventListener("change", (event) => setTheme((event.target as HTMLSelectElement).value));
