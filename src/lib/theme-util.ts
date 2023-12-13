  const select = document.getElementById("themeSwitch") as HTMLSelectElement;
  const theme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";

  console.log('theme -',theme);

  select.value = theme ?? systemTheme;

  function updateTheme(value) {
  const theme = value === "system" ? systemTheme : value;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
  localStorage.setItem("theme", value);
}

  updateTheme(select.value);

  select.addEventListener("change", (event: Event) => {
  const select = event.target as HTMLSelectElement;
  updateTheme(select.value);
});
