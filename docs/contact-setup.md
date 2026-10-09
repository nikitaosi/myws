# Подключение формы nikitaosi.dev

Форма находится на `/contact/`. Письма приходят на `nikitaosipov.51@gmail.com`, а кнопка Reply в почте — отвечает посетителю. Для отправки нужны четыре настройки Netlify и публикация кода формы; без настроек форма предлагает прямые контакты.

## 1. Cloudflare Turnstile

Открой [Turnstile в Cloudflare](https://dash.cloudflare.com/?to=%2F%3Aaccount%2Fturnstile) и войди в свой аккаунт или создай его.

Нажми **Add widget** и задай:

- **Widget name:** `nikitaosi.dev contact`
- **Hostnames:** `nikitaosi.dev`. Добавь `www.nikitaosi.dev`, только если используешь этот адрес.
- **Widget mode:** `Managed`
- **Pre-clearance:** оставь выключенным; форма его не использует.

После создания сохрани **Site key** и **Secret key** в менеджере паролей. Они соответствуют `TURNSTILE_SITE_KEY` и `TURNSTILE_SECRET_KEY` в настройках сайта.

Сайт может оставаться на Netlify: Turnstile работает независимо от хостинга и DNS Cloudflare. [Документация](https://developers.cloudflare.com/turnstile/get-started/).

## 2. Resend: домен и отправитель

Открой [Resend Domains](https://resend.com/domains). После входа добавь поддомен **`mail.nikitaosi.dev`** для отправки писем с формы. Resend рекомендует отдельный поддомен для отправки. [Документация доменов](https://resend.com/docs/dashboard/domains/introduction).

Resend покажет DNS-записи для подтверждения домена и отправки. Добавь их у провайдера, где сейчас управляется DNS `nikitaosi.dev`, с теми именами и значениями, которые показаны в твоём аккаунте. Значения DKIM зависят от аккаунта — в этой инструкции их нет.

Для формы нужна только отправка. Не включай **Receiving**. Сохрани существующие записи сайта и почты; добавляй записи для указанного поддомена. Затем дождись статуса **Verified** в Resend.

После подтверждения используй отправителя:

```text
Nikita Osipov <contact@mail.nikitaosi.dev>
```

Это адрес отправителя уведомлений. Получателем остаётся твой Gmail; отдельный почтовый ящик на поддомене для этого сценария не требуется.

## 3. Resend: ключ

В **API keys → Create API Key** задай:

- **Name:** `nikitaosi.dev contact`
- **Permission:** `Sending access`
- **Domain:** `mail.nikitaosi.dev`

Сохрани ключ сразу в менеджере паролей: Resend показывает его значение только один раз. Он соответствует `RESEND_API_KEY`. [Инструкция Resend](https://resend.com/docs/create-an-api-key).

## 4. Настройки Netlify

Открой проект сайта → **Project configuration → Environment variables**. Добавь четыре переменные:

| Имя | Значение |
| --- | --- |
| `TURNSTILE_SITE_KEY` | Site key из Cloudflare |
| `TURNSTILE_SECRET_KEY` | Secret key из Cloudflare |
| `RESEND_API_KEY` | Ключ Sending access из Resend |
| `CONTACT_FROM_EMAIL` | `Nikita Osipov <contact@mail.nikitaosi.dev>` |

Выбери контекст **Production** и scope **Functions**. Если тариф показывает только All scopes, оставь его. Для secret key и API key включи пометку secret, если она доступна. В поле Netlify вставляй значение без дополнительных кавычек.

После добавления настроек потребуется новый deploy с кодом формы. Сам файл `.env` на Netlify не загружается автоматически. [Документация Netlify](https://docs.netlify.com/build/environment-variables/get-started/).

## Локальная проверка

Пустой `.env` уже подготовлен в корне проекта и исключён из Git. Для локальной работы вставь туда ключи; значение отправителя с пробелами заключи в кавычки:

```dotenv
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
RESEND_API_KEY=
CONTACT_FROM_EMAIL="Nikita Osipov <contact@mail.nikitaosi.dev>"
```

Для полноценной локальной проверки создай отдельный Turnstile widget с разрешённым hostname `127.0.0.1` (и `localhost`, если открываешь сайт так), а его пару ключей вставь только в локальный `.env`. Production widget оставь привязанным к `nikitaosi.dev`. [Документация локального тестирования](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

Официальные dummy-ключи подходят для отдельных тестов, но их фиксированные hostname/action могут не пройти строгие проверки этого обработчика. Автоматические тесты проекта используют имитацию ответа сервиса; для реальной проверки оставь проверки hostname и action `contact` включёнными.

Команда `yarn check:contact` проверит наличие четырёх настроек и формат отправителя. Она не выводит значения ключей, не обращается к сервисам и не отправляет письма. Наличие ключей ещё не подтверждает их действительность или DNS — это проверяется реальной отправкой после публикации.

## Завершение

После подключения и публикации отправь одно тестовое сообщение через `/contact/`. Проверь получение в Gmail, Reply-To посетителя и обе темы. До этой проверки реальная доставка остаётся неподтверждённой.

Ключи в чат присылать не нужно. Когда настройки будут готовы, достаточно написать: «Ключи добавлены в Netlify, домен Verified».
