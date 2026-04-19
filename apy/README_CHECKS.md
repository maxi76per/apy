# Проверка защиты приложения

Этот файл содержит готовые команды для PowerShell и краткие пояснения по результатам проверки.

## 1. Запуск сервера

Откройте PowerShell в папке проекта и выполните:

```powershell
npm.cmd start
```

Ожидаемый результат:
- сервер запускается на `http://localhost:3000`
- в консоли появляется сообщение `Secure server running on http://localhost:3000`

## 2. Проверка списка пользователей

Команда:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/users | Select-Object -ExpandProperty Content
```

Что проверяется:
- приложение выдает список пользователей
- пароли не попадают в ответ

Ожидаемый результат:
- в JSON видны только `username`, `email`, `role`
- поля `password` в ответе нет

## 3. Проверка запрета изменения роли без токена

Команда:

```powershell
Invoke-WebRequest -UseBasicParsing -Method Put -ContentType 'application/json' -Body '{"role":"admin"}' http://localhost:3000/users/2
```

Что проверяется:
- изменение данных без токена администратора запрещено

Ожидаемый результат:
- сервер возвращает ошибку `403 Forbidden`

## 4. Проверка ограничения изменяемых полей

Команда:

```powershell
Invoke-WebRequest -UseBasicParsing -Method Put -ContentType 'application/json' -Body '{"role":"admin"}' 'http://localhost:3000/users/2?token=admin_token'
```

Что проверяется:
- даже администратор не может менять запрещенные поля

Ожидаемый результат:
- сервер возвращает ошибку `400 Bad Request`
- в тексте ответа указано, что можно менять только `email` и `password`

## 5. Проверка разрешенного обновления данных

Команда:

```powershell
Invoke-WebRequest -UseBasicParsing -Method Put -ContentType 'application/json' -Body '{"email":"newemail@test.com","password":"newsecurepass"}' 'http://localhost:3000/users/2?token=admin_token' | Select-Object -ExpandProperty Content
```

Что проверяется:
- разрешенные поля обновляются успешно

Ожидаемый результат:
- возвращается обновленный пользователь
- в ответе нет поля `password`
- значение `role` остается прежним

## 6. Просмотр журнала безопасности

Команда:

```powershell
Invoke-WebRequest -UseBasicParsing 'http://localhost:3000/logs?token=admin_token' | Select-Object -ExpandProperty Content
```

Что проверяется:
- приложение фиксирует попытки несанкционированного доступа

Ожидаемый результат:
- в журнале есть записи с причиной отказа
- например, отсутствие токена или попытка изменить запрещенное поле

## 7. Почему не сработал `curl`

В PowerShell команда `curl` обычно является псевдонимом для `Invoke-WebRequest`, а не для обычного `curl`, как в Linux.

Из-за этого команды вида:

```powershell
curl -X PUT -H "Content-Type: application/json" -d "{\"role\":\"admin\"}" http://localhost:3000/users/2
```

могут завершаться ошибкой привязки параметров.

Если нужен именно `curl`, используйте:

```powershell
curl.exe http://localhost:3000/users
curl.exe -X PUT -H "Content-Type: application/json" -d "{\"role\":\"admin\"}" "http://localhost:3000/users/2?token=admin_token"
```

## 8. Выводы

В результате проверки подтверждается:
- конфиденциальные данные скрыты из выдачи
- доступ к административным действиям ограничен токеном
- запрещенные поля нельзя изменять через API
- журнал безопасности фиксирует подозрительные запросы
