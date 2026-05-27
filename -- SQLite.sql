-- SQLite
SELECT * FROM usuarios WHERE ativo = 1;
SELECT nome, email FROM usuarios WHERE ativo = 1;
SELECT * FROM produtos WHERE preco > 1000;
SELECT nome FROM produtos WHERE categoria = 'hardware';
SELECT * FROM pedidos WHERE data >= '2024-01-01';
SELECT * FROM usuarios WHERE email LIKE '%@example.com';

