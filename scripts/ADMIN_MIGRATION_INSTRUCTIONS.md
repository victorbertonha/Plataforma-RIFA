Passos para aplicar migração quando seu Supabase estiver ativo

1) Via Supabase SQL Editor (preferido)

- Abra seu projeto no supabase.com → SQL Editor
- Cole o conteúdo de `scripts/add-prize-price.sql` e execute

2) Via psql (linha de comando)

Certifique-se de ter `psql` instalado e a variável `DATABASE_URL` apontando para seu banco.

Exemplo (Windows PowerShell):

```powershell
$env:DATABASE_URL = "postgres://USER:PASSWORD@HOST:PORT/DATABASE"
psql $env:DATABASE_URL -f scripts/add-prize-price.sql
```

3) Verificações rápidas após execução

- SELECT column_name FROM information_schema.columns WHERE table_name='campaigns' AND column_name='prize_price';
- SELECT * FROM campaign_status LIMIT 5;

4) Se precisar criar uma conta admin

Execute (substitua email):

```sql
UPDATE users SET role = 'admin' WHERE email = 'seu-email@example.com';
```

5) Se preferir, posso aplicar o script quando você confirmar que o Supabase voltou.
